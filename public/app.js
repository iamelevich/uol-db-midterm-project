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
      // Fetch articles
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
        // Add notification
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
        // Send POST request to create comment
        const response = await fetch(`/api/comments/${this.article_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: this.newCommentText
          })
        });
        // Parse response
        const responseBody = await response.json();
        // Check and display error
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
        // Clear comment textarea
        this.newCommentText = '';
        // Add notification
        this.$store.notifications.add('success', 'Comment was successfully added!');
        await this.getComments();
      } catch (error) {
        // Show error message
        this.errorMessage = error.message;
        // Add notification
        this.$store.notifications.add('error', error.message);
      } finally {
        // Mar that no submitting
        this.submitting = false;
      }
    },
    async getComments() {
      // If loading not run it again
      if (this.isLoading) {
        return;
      }
      this.isLoading = true;

      // Fetch comments
      const commentsResponseRaw = await fetch(`/api/comments/${this.article_id}`);
      // Check errors
      if (commentsResponseRaw.status !== 200) {
        let message = responseBody.message;
        if (responseBody.errors && responseBody.errors.length) {
          message = responseBody.errors
            .map((responseError) => {
              return responseError.msg;
            })
            .join('. ');
        }
        // Add notification
        this.$store.notifications.add('error', `Comments loading error: ${message}`);
        return;
      }
      // Update comments array
      this.comments = await commentsResponseRaw.json();

      this.isLoading = false;
    }
  };
}

function createDraftData() {
  return {
    draft: {
      title: '',
      subtitle: '',
      url: '',
      text: ''
    },
    submitting: false,
    errors: {},
    updateSlug() {
      let str = this.draft.title.trim().toLowerCase();

      // remove accents, swap ñ for n, etc
      const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
      const to = 'aaaaeeeeiiiioooouuuunc------';
      for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
      }

      this.draft.url = str
        .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes
    },
    wysiwyg: null,
    initWysiwyg(el) {
      // Get el
      this.wysiwyg = el;
      // Add CSS
      this.wysiwyg.contentDocument.querySelector('head').innerHTML += `<style>
          *, ::after, ::before {box-sizing: border-box;}
          :root {tab-size: 4;}
          html {line-height: 1.15;text-size-adjust: 100%;}
          body {margin: 0px; padding: 1rem 0.5rem;}
          body {font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';}
        </style>`;
      this.wysiwyg.contentDocument.body.innerHTML += this.draft.text;
      // this.wysiwyg.contentDocument.body.addEventListener('click', () => {
      //   delete this.errors.article_text;
      // });
      // Make editable
      this.wysiwyg.contentDocument.designMode = 'on';
    },
    format: function (cmd, param) {
      this.wysiwyg.contentDocument.execCommand(cmd, !1, param || null);
    },
    async save() {
      if (this.submitting) {
        return;
      }
      this.submitting = true;
      // Make not editable
      this.wysiwyg.contentDocument.designMode = 'off';
      this.draft.text = this.wysiwyg.contentDocument.body.innerHTML;
      try {
        const response = await fetch('/api/articles/draft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            article_title: this.draft.title,
            article_subtitle: this.draft.subtitle,
            article_text: this.draft.text,
            article_url: this.draft.url
          })
        });
        const responseBody = await response.json();
        if (response.status !== 200) {
          let message = responseBody.message || 'Validation error';
          if (responseBody.errors && responseBody.errors.length) {
            for (const validationError of responseBody.errors) {
              this.errors[validationError.param] = validationError.msg;
            }
          }
          throw new Error(message || 'Something went wrong. Please try again later');
        }
        this.changed = false;
        window.location.href = '/admin';
      } catch (error) {
        this.errorMessage = error.message;
        this.$store.notifications.add('error', error.message);
      } finally {
        // Make not editable
        this.wysiwyg.contentDocument.designMode = 'on';
        this.submitting = false;
      }
    }
  };
}
