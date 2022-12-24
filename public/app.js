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
});
