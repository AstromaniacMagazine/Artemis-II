// Reading the report never depends on JavaScript. Enhance controls only.
export function initialiseReport(root) {
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const controller = new AbortController();
  const on = (el, event, fn) => el.addEventListener(event, fn, { signal: controller.signal });
  const player = root.querySelector('[data-player]');
  const audio = player.querySelector('audio');
  const status = player.querySelector('[data-player-status]');
  let activeAudio;
  const pauseMedia = except => root.querySelectorAll('audio,video').forEach(m => { if (m !== except) m.pause(); });
  const clearAudioButton = () => activeAudio?.removeAttribute('aria-current');
  on(root, 'click', async event => {
    const link = event.target.closest('[data-audio]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    clearAudioButton(); activeAudio = link;
    link.setAttribute('aria-current', 'true'); player.hidden = false;
    player.querySelector('[data-player-label]').textContent = link.textContent.trim();
    player.querySelector('[data-audio-fallback]').href = link.href;
    status.textContent = 'Loading audio…'; pauseMedia(audio);
    if (audio.src !== link.href) audio.src = link.href;
    try { await audio.play(); status.textContent = ''; }
    catch { status.textContent = 'Use the player to try again, or open the original recording.'; }
  });
  on(audio, 'error', () => { status.textContent = 'Recording unavailable. Try the original recording link.'; clearAudioButton(); });
  on(audio, 'ended', clearAudioButton);
  on(audio, 'play', () => pauseMedia(audio));
  on(player.querySelector('[data-player-close]'), 'click', () => {
    audio.pause(); player.hidden = true; clearAudioButton(); activeAudio?.focus();
  });
  root.querySelectorAll('[data-video]').forEach(frame => {
    const button = frame.querySelector('[data-video-play]');
    const video = frame.querySelector('video');
    button.hidden = false;
    on(button, 'click', async () => {
      if (!video.src) { video.src = matchMedia('(max-width:760px)').matches ? (video.dataset.mobile || video.dataset.src) : video.dataset.src; video.load(); }
      video.hidden = false; video.controls = true; pauseMedia(video);
      try { await video.play(); button.hidden = true; }
      catch { frame.querySelector('[data-video-status]').textContent = 'Use the player or open the original video below.'; }
    });
    on(video, 'play', () => { pauseMedia(video); button.hidden = true; });
    on(video, 'error', () => { frame.querySelector('[data-video-status]').textContent = 'Video unavailable. Open the original video below.'; button.hidden = false; });
  });
  root.querySelectorAll('[data-tabs]').forEach(group => {
    const tabs = [...group.querySelectorAll('[data-tab]')];
    const panels = [...group.querySelectorAll('[data-panel]')];
    if (!tabs.length || tabs.length !== panels.length) return;
    const list = group.querySelector('[data-tablist]');
    list.hidden = false; list.setAttribute('role', 'tablist');
    tabs.forEach((tab, i) => {
      tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', panels[i].id);
      panels[i].setAttribute('role', 'tabpanel'); panels[i].setAttribute('aria-labelledby', tab.id); panels[i].tabIndex = 0;
    });
    function select(index, focus = false) {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
        if (i !== index) panels[i].querySelectorAll('video').forEach(v => v.pause());
      });
      if (focus) tabs[index].focus({ preventScroll: true });
    }
    tabs.forEach((tab, i) => {
      on(tab, 'click', () => select(i));
      on(tab, 'keydown', event => {
        const next = { ArrowRight:(i + 1) % tabs.length, ArrowLeft:(i + tabs.length - 1) % tabs.length, Home:0, End:tabs.length - 1 }[event.key];
        if (next !== undefined) { event.preventDefault(); select(next, true); }
      });
    }); select(0);
  });
  const menu = root.querySelector('[data-section-menu]');
  on(root, 'click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const target = root.querySelector(link.hash);
    if (!target) return;
    if (menu?.contains(link)) menu.open = false;
    event.preventDefault(); history.replaceState(null, '', link.hash);
    target.scrollIntoView({ behavior:reducedMotion.matches ? 'instant' : 'smooth', block:'start' });
    target.tabIndex = -1; target.focus({ preventScroll:true });
  });
  on(document, 'keydown', event => { if (event.key === 'Escape' && menu?.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  on(document, 'click', event => { if (menu?.open && !menu.contains(event.target)) menu.open = false; });
  on(document, 'visibilitychange', () => { if (document.hidden) pauseMedia(); });
  const mediaObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    entries.forEach(entry => { if (!entry.isIntersecting) entry.target.pause(); });
  }) : null;
  root.querySelectorAll('video').forEach(v => mediaObserver?.observe(v));
  const navLinks = [...root.querySelectorAll('[data-section-menu] a')];
  const sectionObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    const visible = entries.find(entry => entry.isIntersecting);
    if (!visible) return;
    navLinks.forEach(link => { if (link.hash === `#${visible.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  }, { rootMargin:'-10% 0px -65% 0px' }) : null;
  root.querySelectorAll('section[id]').forEach(s => sectionObserver?.observe(s));
  const dispose = () => { pauseMedia(); controller.abort(); mediaObserver?.disconnect(); sectionObserver?.disconnect(); };
  on(root, 'am:dispose', dispose);
  return dispose;
}
initialiseReport(document.querySelector('#am-artemis'));
