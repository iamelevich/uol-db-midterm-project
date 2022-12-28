// Need to setup icons (replaces all <i> with svg)
eva.replace();

// Detect is dart theme on
const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');
document.addEventListener('alpine:init', () => {
  // Add store to change dark theme
  Alpine.store('darkMode', {
    on: Alpine.$persist(darkThemeMq.matches).as('darkMode_on'),
    toggle() {
      this.on = !this.on;
    }
  });

  // Add store to the notifications
  Alpine.store('notifications', {
    data: new Set(),
    add(type, text) {
      this.data.add({
        type,
        text
      });
    },
    remove(item) {
      this.data.delete(item);
    }
  });
});

// Infinite scroll on the main page
function infiniteScrollPublishedArticles() {
  return {
    triggerElement: null,
    page: 1,
    lastPage: null,
    itemsPerPage: 10,
    observer: null,
    isObserverPolyfilled: false,
    items: [],
    isFetching: false,
    // Init listener for infinity scroll
    async init(elementId) {
      const ctx = this;
      this.triggerElement = document.querySelector(elementId ? elementId : '#infinite-scroll-trigger');

      // Check if browser can use IntersectionObserver which is waaaay more performant
      if (
        !('IntersectionObserver' in window) ||
        !('IntersectionObserverEntry' in window) ||
        !('isIntersecting' in window.IntersectionObserverEntry.prototype) ||
        !('intersectionRatio' in window.IntersectionObserverEntry.prototype)
      ) {
        // Loading polyfill since IntersectionObserver is not available
        this.isObserverPolyfilled = true;

        // Storing function in window so we can wipe it when reached last page
        window.alpineInfiniteScroll = {
          scrollFunc() {
            var position = ctx.triggerElement.getBoundingClientRect();

            if (position.top < window.innerHeight && position.bottom >= 0) {
              ctx.getItems();
            }
          }
        };

        window.addEventListener('scroll', window.alpineInfiniteScroll.scrollFunc);
      } else {
        // We can access IntersectionObserver
        this.observer = new IntersectionObserver(
          function (entries) {
            if (entries[0].isIntersecting === true) {
              ctx.getItems();
            }
          },
          { threshold: [0] }
        );

        this.observer.observe(this.triggerElement);
      }

      this.getItems();
    },
    // Fetch articles from backend
    async getItems() {
      // Prevent fetching more than once at the same time
      if (this.isFetching) {
        return;
      }
      this.isFetching = true;
      const searchParams = new URLSearchParams({
        page: this.page,
        pageSize: this.itemsPerPage
      });
      const itemsResponse = await fetch(`/api/articles/published?${searchParams.toString()}`);
      if (itemsResponse.status !== 200) {
        let message = responseBody.message;
        if (responseBody.errors && responseBody.errors.length) {
          message = responseBody.errors
            .map((responseError) => {
              return responseError.msg;
            })
            .join('. ');
        }
        this.$store.notifications.add('error', `Articles loading error: ${message}`);
        return;
      }
      // Parse response
      const parsedItemsResponse = await itemsResponse.json();
      // Calculate last page
      this.lastPage = Math.ceil(parsedItemsResponse.count / this.itemsPerPage);
      // Set items
      this.items = this.items.concat(parsedItemsResponse.articles);

      // Next page
      this.page++;

      // We have shown the last page - clean up
      if (this.lastPage && this.page > this.lastPage) {
        if (this.isObserverPolyfilled) {
          window.removeEventListener('scroll', window.alpineInfiniteScroll.scrollFunc);
        } else {
          this.observer.unobserve(this.triggerElement);
        }

        this.triggerElement.remove();
      }
      this.isFetching = false;
    }
  };
}

function commentsSection(article_id) {
  return {
    article_id,
    comments: [],
    newCommentText: '',
    submitting: false,
    isLoading: false,
    errorMessage: undefined,
    init() {
      this.getComments();
    },
    async postComment() {
      if (this.submitting) {
        return;
      }
      this.submitting = true;
      try {
        const response = await fetch(`/api/comments/${this.article_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: this.newCommentText
          })
        });
        const responseBody = await response.json();
        if (response.status !== 200) {
          let message = responseBody.message;
          if (responseBody.errors && responseBody.errors.length) {
            message = responseBody.errors
              .map((responseError) => {
                return responseError.msg;
              })
              .join('. ');
          }
          throw new Error(message || 'Something went wrong. Please try again later');
        }
        this.newCommentText = '';
        this.$store.notifications.add('success', 'Comment was successfully added!');
        await this.getComments();
      } catch (error) {
        this.errorMessage = error.message;
        this.$store.notifications.add('error', error.message);
      } finally {
        this.submitting = false;
      }
    },
    async getComments() {
      // If loading not run it again
      if (this.isLoading) {
        return;
      }
      this.isLoading = true;

      const commentsResponseRaw = await fetch(`/api/comments/${this.article_id}`);
      if (commentsResponseRaw.status !== 200) {
        let message = responseBody.message;
        if (responseBody.errors && responseBody.errors.length) {
          message = responseBody.errors
            .map((responseError) => {
              return responseError.msg;
            })
            .join('. ');
        }
        this.$store.notifications.add('error', `Comments loading error: ${message}`);
        return;
      }
      this.comments = await commentsResponseRaw.json();

      this.isLoading = false;
    }
  };
}
