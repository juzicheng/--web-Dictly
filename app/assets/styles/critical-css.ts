export const criticalCss = String.raw`
@layer reset, tokens, base, layout, components, utilities;

@layer tokens {
  :root {
    color-scheme: light;
    --dt-canvas: #d7d7d7;
    --dt-app: #f4f5f7;
    --dt-surface: #ffffff;
    --dt-surface-soft: #fafafd;
    --dt-surface-muted: #f0eef7;
    --dt-border: #eceaf2;
    --dt-border-strong: #dedbe7;
    --dt-text: #15151a;
    --dt-muted: #70717d;
    --dt-faint: #9a9ba6;
    --dt-primary: #7457f4;
    --dt-primary-strong: #5f45df;
    --dt-primary-soft: #f1eeff;
    --dt-green: #20c986;
    --dt-cyan: #35bfe8;
    --dt-yellow: #ffd949;
    --dt-radius: 8px;
    --dt-frame-radius: 22px;
    --dt-shadow-soft: 0 8px 24px rgba(23, 23, 33, 0.05);
  }
}

@layer reset {
  * {
    box-sizing: border-box;
  }

  html,
  body,
  #__nuxt {
    min-height: 100%;
    margin: 0;
  }
}

@layer base {
  body {
    min-width: 320px;
    background: var(--dt-canvas);
    color: var(--dt-text);
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }

  :focus-visible {
    outline: 2px solid color-mix(in srgb, var(--dt-primary) 72%, white);
    outline-offset: 2px;
  }
}

@layer layout {
  .app-canvas {
    min-height: 100vh;
    padding: 24px;
    background: var(--dt-canvas);
  }

  .app-frame {
    display: flex;
    width: min(100%, 1660px);
    height: calc(100vh - 96px);
    min-height: 0;
    max-height: calc(100vh - 96px);
    margin: 0 auto;
    overflow: hidden;
    background: var(--dt-app);
    border: 1px solid rgba(255, 255, 255, 0.72);
    border-radius: var(--dt-frame-radius);
    box-shadow: 0 20px 80px rgba(20, 20, 28, 0.14);
  }

  .app-sidebar {
    background: var(--dt-surface);
    border-inline-end: 1px solid var(--dt-border);
  }

  .app-sidebar .ant-layout-sider-children {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 100%;
    padding: 24px 14px 18px;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px 22px;
    color: var(--dt-text);
    font-weight: 800;
  }

  .brand-mark,
  .upgrade-mark {
    display: inline-grid;
    place-items: center;
    color: #ffffff;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.28), transparent),
      var(--dt-primary);
  }

  .brand-mark {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    font-size: 1.15rem;
  }

  .brand-name {
    font-size: 1.28rem;
    letter-spacing: 0;
  }

  .app-main {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    max-height: 100%;
    background: var(--dt-app);
  }

  .app-topbar,
  .ant-layout.app-frame .ant-layout-header.app-topbar {
    display: flex;
    align-items: center;
    gap: 18px;
    height: 74px;
    padding: 0 22px;
    line-height: normal;
    background: var(--dt-surface);
    border-bottom: 1px solid var(--dt-border);
  }

  .top-title {
    display: grid;
    gap: 3px;
    min-width: 150px;
    margin-inline-end: auto;
  }

  .top-title h1 {
    margin: 0;
    color: var(--dt-text);
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: 0;
  }

  .top-title span {
    color: var(--dt-muted);
    font-size: 0.8rem;
  }

  .mobile-nav {
    display: none;
    gap: 8px;
    align-items: center;
  }

  .top-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .top-search {
    width: min(360px, 28vw);
  }

  .user-area {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 4px 6px 4px 4px;
    background: var(--dt-surface);
    border-radius: var(--dt-radius);
  }

  .user-copy {
    display: grid;
    min-width: 86px;
    line-height: 1.1;
  }

  .user-name {
    color: var(--dt-text);
    font-size: 0.84rem;
    font-weight: 750;
    white-space: nowrap;
  }

  .user-tier {
    margin-top: 3px;
    color: var(--dt-muted);
    font-size: 0.72rem;
  }

  .app-content {
    flex: 1 1 auto;
    min-height: 0;
    padding: 12px;
    overflow: auto;
    background: var(--dt-app);
    scrollbar-gutter: stable;
  }
}

@layer components {
  .ant-layout {
    background: transparent;
  }

  .ant-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 34px;
    font-weight: 650;
    border-radius: var(--dt-radius);
    box-shadow: none;
  }

  .ant-btn-primary {
    background: var(--dt-primary);
    border-color: var(--dt-primary);
  }

  .top-icon-button,
  .logout-button {
    width: 38px;
    height: 38px;
    color: var(--dt-text);
    background: var(--dt-surface-soft);
    border: 1px solid var(--dt-border);
  }

  html.dictly-startup-loading--active:not(.dictly-startup-loading--done) body > #__nuxt {
    visibility: hidden;
  }

  #dictly-startup-loading {
    --dictly-loader-primary: #7457f4;
    --dictly-loader-cyan: #35bfe8;
    --dictly-loader-green: #20c986;
    --dictly-loader-yellow: #ffd949;
    --dictly-loader-surface: #ffffff;
    --dictly-loader-text: #15151a;
    --dictly-loader-muted: #70717d;

    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: grid;
    place-items: center;
    min-width: 320px;
    padding: 24px;
    overflow: hidden;
    isolation: isolate;
    background:
      radial-gradient(circle at 50% 34%, rgba(116, 87, 244, 0.18), transparent 30%),
      radial-gradient(circle at 35% 58%, rgba(32, 201, 134, 0.18), transparent 28%),
      radial-gradient(circle at 66% 60%, rgba(53, 191, 232, 0.16), transparent 30%),
      linear-gradient(135deg, #f8f8fb 0%, #f2f1f8 48%, #e7e5ef 100%);
    color: var(--dictly-loader-text);
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    transition:
      opacity 180ms cubic-bezier(0.22, 0.61, 0.36, 1),
      visibility 180ms ease;
  }

  #dictly-startup-loading::before,
  #dictly-startup-loading::after {
    content: "";
    position: absolute;
    z-index: -1;
    border-radius: 999px;
    opacity: 0.74;
    animation: dictly-startup-aurora-drift 3000ms ease-in-out infinite alternate;
    will-change: transform, opacity;
  }

  #dictly-startup-loading::before {
    inline-size: 46vw;
    block-size: 46vw;
    min-width: 360px;
    min-height: 360px;
    background: radial-gradient(circle, rgba(116, 87, 244, 0.22), transparent 66%);
    transform: translate(-22vw, -18vh);
  }

  #dictly-startup-loading::after {
    inline-size: 38vw;
    block-size: 38vw;
    min-width: 320px;
    min-height: 320px;
    background: radial-gradient(circle, rgba(53, 191, 232, 0.2), transparent 66%);
    animation-delay: -1800ms;
    transform: translate(22vw, 18vh);
  }

  #dictly-startup-loading.dictly-startup-loading--leaving {
    opacity: 0;
    visibility: hidden;
  }

  #dictly-startup-loading.dictly-startup-loading--leaving .dictly-startup-loading__shell {
    transform: translateY(8px) scale(0.96);
  }

  .dictly-startup-loading__shell {
    position: relative;
    display: grid;
    gap: 18px;
    justify-items: center;
    inline-size: min(430px, calc(100vw - 48px));
    text-align: center;
    perspective: 900px;
    animation: dictly-startup-shell-in 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .dictly-startup-loading__scene {
    position: relative;
    inline-size: min(360px, calc(100vw - 64px));
    block-size: 258px;
    transform-style: preserve-3d;
    animation: dictly-startup-scene-breathe 1200ms ease-in-out infinite;
    will-change: transform;
  }

  .dictly-startup-loading__mesh {
    position: absolute;
    inset: 20px 8px 8px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.78);
    border-radius: 22px;
    background:
      linear-gradient(rgba(116, 87, 244, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(53, 191, 232, 0.08) 1px, transparent 1px),
      linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(255, 255, 255, 0.34));
    background-size: 28px 28px, 28px 28px, 100% 100%;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.85),
      0 26px 80px rgba(35, 31, 66, 0.14);
    transform: rotateX(58deg) rotateZ(-8deg) translateY(22px);
    transform-origin: center;
  }

  .dictly-startup-loading__mesh::before,
  .dictly-startup-loading__mesh::after {
    content: "";
    position: absolute;
    pointer-events: none;
    will-change: transform, opacity;
  }

  .dictly-startup-loading__mesh::before {
    inset-block: -18px;
    inline-size: 86px;
    background: linear-gradient(90deg, transparent, rgba(53, 191, 232, 0.28), transparent);
    opacity: 0;
    transform: translateX(-110px) skewX(-16deg);
    animation: dictly-startup-mesh-sweep 980ms cubic-bezier(0.22, 0.61, 0.36, 1) infinite;
  }

  .dictly-startup-loading__mesh::after {
    inset-inline: 28px;
    inset-block-end: 38px;
    block-size: 2px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--dictly-loader-primary),
      var(--dictly-loader-green),
      transparent
    );
    opacity: 0.68;
    transform: scaleX(0.2);
    transform-origin: center;
    animation: dictly-startup-mesh-lane 760ms ease-in-out infinite alternate;
  }

  .dictly-startup-loading__beam {
    position: absolute;
    inset-inline: 30px;
    block-size: 2px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--dictly-loader-cyan),
      var(--dictly-loader-green),
      transparent
    );
    opacity: 0.78;
    transform: translate3d(-72px, 0, 46px) scaleX(0.42);
    animation: dictly-startup-scan 900ms cubic-bezier(0.22, 0.61, 0.36, 1) infinite;
    will-change: transform, opacity;
  }

  .dictly-startup-loading__beam--one {
    inset-block-start: 84px;
  }

  .dictly-startup-loading__beam--two {
    inset-block-start: 150px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--dictly-loader-primary),
      var(--dictly-loader-yellow),
      transparent
    );
    animation-delay: -620ms;
  }

  .dictly-startup-loading__orbit {
    position: absolute;
    inset-block-start: 22px;
    inset-inline-start: 50%;
    inline-size: 184px;
    block-size: 184px;
    border: 3px solid rgba(116, 87, 244, 0.18);
    border-block-start-color: var(--dictly-loader-primary);
    border-inline-end-color: var(--dictly-loader-cyan);
    border-block-end-color: var(--dictly-loader-green);
    border-inline-start-color: rgba(255, 217, 73, 0.18);
    border-radius: 50%;
    transform: translateX(-50%);
    transform-style: preserve-3d;
    animation: dictly-startup-orbit-spin 780ms linear infinite;
    will-change: transform;
  }

  .dictly-startup-loading__orbit::before,
  .dictly-startup-loading__orbit::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }

  .dictly-startup-loading__orbit::before {
    inset: 8px;
    border: 1px solid rgba(116, 87, 244, 0.22);
    box-shadow: inset 0 0 36px rgba(116, 87, 244, 0.12);
  }

  .dictly-startup-loading__orbit::after {
    inset: 22px;
    border: 1px dashed rgba(53, 191, 232, 0.36);
    animation: dictly-startup-counter-spin 1300ms linear infinite;
  }

  .dictly-startup-loading__dot {
    position: absolute;
    inline-size: 12px;
    block-size: 12px;
    border-radius: 50%;
    background: var(--dictly-loader-surface);
    box-shadow:
      0 0 0 4px rgba(116, 87, 244, 0.14),
      0 10px 22px rgba(35, 31, 66, 0.18);
    animation: dictly-startup-dot-pulse 640ms ease-in-out infinite alternate;
    animation-delay: var(--dot-delay);
    will-change: transform, opacity;
  }

  .dictly-startup-loading__dot--primary {
    --dot-delay: 0ms;
    inset-block-start: 1px;
    inset-inline-start: 84px;
    background: var(--dictly-loader-primary);
  }

  .dictly-startup-loading__dot--cyan {
    --dot-delay: -180ms;
    inset-block-start: 94px;
    inset-inline-end: 4px;
    background: var(--dictly-loader-cyan);
  }

  .dictly-startup-loading__dot--green {
    --dot-delay: -360ms;
    inset-block-end: 18px;
    inset-inline-start: 28px;
    background: var(--dictly-loader-green);
  }

  .dictly-startup-loading__logo {
    position: absolute;
    inset-block-start: 62px;
    inset-inline-start: 50%;
    z-index: 2;
    display: grid;
    place-items: center;
    inline-size: 96px;
    block-size: 96px;
    overflow: hidden;
    isolation: isolate;
    border: 1px solid rgba(255, 255, 255, 0.78);
    border-radius: 22px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.36), transparent),
      linear-gradient(
        135deg,
        var(--dictly-loader-primary) 0%,
        var(--dictly-loader-cyan) 58%,
        var(--dictly-loader-green) 100%
      );
    color: #ffffff;
    box-shadow:
      inset 0 -18px 28px rgba(63, 44, 176, 0.24),
      0 26px 80px rgba(35, 31, 66, 0.18),
      0 0 0 10px rgba(255, 255, 255, 0.42);
    font-size: 2.35rem;
    font-weight: 850;
    line-height: 1;
    transform: translateX(-50%);
    animation: dictly-startup-logo-float 980ms ease-in-out infinite;
    will-change: transform;
  }

  .dictly-startup-loading__logo span {
    position: relative;
    z-index: 2;
  }

  .dictly-startup-loading__logo::before,
  .dictly-startup-loading__logo::after {
    content: "";
    position: absolute;
    pointer-events: none;
    will-change: transform, opacity;
  }

  .dictly-startup-loading__logo::before {
    inset: 12px;
    z-index: 0;
    border-radius: 16px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.72), transparent 68%);
    opacity: 0;
    transform: scale(0.68);
    animation: dictly-startup-logo-pulse 740ms ease-out infinite;
  }

  .dictly-startup-loading__logo::after {
    inset-block: -24px;
    inset-inline-start: 0;
    z-index: 1;
    inline-size: 28px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.74), transparent);
    transform: translateX(-92px) rotate(18deg);
    animation: dictly-startup-logo-sheen 920ms ease-in-out infinite;
  }

  .dictly-startup-loading__card {
    position: absolute;
    z-index: 3;
    display: grid;
    gap: 2px;
    min-inline-size: 126px;
    padding: 9px 12px;
    overflow: hidden;
    border: 1px solid rgba(236, 234, 242, 0.92);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 16px 44px rgba(35, 31, 66, 0.12);
    text-align: start;
    transform: translate3d(var(--x), var(--y), var(--z)) rotate(var(--r));
    animation: dictly-startup-card-float 1050ms ease-in-out infinite;
    animation-delay: var(--delay);
    will-change: transform, opacity;
  }

  .dictly-startup-loading__card::after {
    content: "";
    position: absolute;
    inset-block: -16px;
    inset-inline-start: 0;
    inline-size: 34px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.92), transparent);
    opacity: 0;
    transform: translateX(-54px) rotate(16deg);
    animation: dictly-startup-card-sheen 980ms ease-in-out infinite;
    animation-delay: var(--delay);
    pointer-events: none;
    will-change: transform, opacity;
  }

  .dictly-startup-loading__card b {
    color: var(--dictly-loader-muted);
    font-size: 0.65rem;
    font-weight: 820;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .dictly-startup-loading__card span {
    color: var(--dictly-loader-text);
    font-size: 0.8rem;
    font-weight: 780;
    white-space: nowrap;
  }

  .dictly-startup-loading__card--source {
    --x: 12px;
    --y: 38px;
    --x2: -18px;
    --y2: 22px;
    --z: 74px;
    --r: -5deg;
    --r2: 3.5deg;
    --delay: -120ms;
    inset-block-start: 0;
    inset-inline-start: 0;
  }

  .dictly-startup-loading__card--zh {
    --x: -14px;
    --y: -8px;
    --x2: 18px;
    --y2: -28px;
    --z: 82px;
    --r: 4deg;
    --r2: -2.8deg;
    --delay: -760ms;
    inset-block-start: 112px;
    inset-inline-start: 2px;
    border-inline-start: 3px solid var(--dictly-loader-green);
  }

  .dictly-startup-loading__card--en {
    --x: -18px;
    --y: 20px;
    --x2: 20px;
    --y2: -2px;
    --z: 92px;
    --r: 5deg;
    --r2: -3.5deg;
    --delay: -1320ms;
    inset-block-start: 70px;
    inset-inline-end: 0;
    border-inline-start: 3px solid var(--dictly-loader-cyan);
  }

  .dictly-startup-loading__card--ja {
    --x: 14px;
    --y: -4px;
    --x2: -18px;
    --y2: -24px;
    --z: 86px;
    --r: -4deg;
    --r2: 2.8deg;
    --delay: -1740ms;
    inset-block-end: 0;
    inset-inline-end: 26px;
    border-inline-start: 3px solid var(--dictly-loader-yellow);
  }

  .dictly-startup-loading__copy {
    display: grid;
    gap: 4px;
    justify-items: center;
    color: var(--dictly-loader-muted);
    animation: dictly-startup-copy-rise 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .dictly-startup-loading__copy strong {
    color: var(--dictly-loader-text);
    font-size: 1rem;
    font-weight: 850;
  }

  .dictly-startup-loading__copy span {
    font-size: 0.78rem;
    font-weight: 720;
  }

  .dictly-startup-loading__progress {
    position: relative;
    inline-size: min(292px, calc(100vw - 64px));
    block-size: 6px;
    overflow: hidden;
    background: linear-gradient(90deg, rgba(116, 87, 244, 0.12), rgba(32, 201, 134, 0.12));
    border-radius: 999px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.54);
  }

  .dictly-startup-loading__progress::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      var(--dictly-loader-primary),
      var(--dictly-loader-cyan),
      var(--dictly-loader-green),
      var(--dictly-loader-yellow),
      var(--dictly-loader-primary)
    );
    transform: translateX(-76%);
    animation: dictly-startup-progress 760ms cubic-bezier(0.65, 0, 0.35, 1) infinite;
    will-change: transform;
  }

  .dictly-startup-loading__progress::after {
    content: "";
    position: absolute;
    inset-block: 1px;
    inline-size: 16px;
    border-radius: 999px;
    background: #ffffff;
    box-shadow:
      0 0 0 3px rgba(116, 87, 244, 0.12),
      0 0 18px rgba(53, 191, 232, 0.54);
    transform: translateX(-18px);
    animation: dictly-startup-progress-dot 760ms cubic-bezier(0.65, 0, 0.35, 1) infinite;
    will-change: transform, opacity;
  }
}

@layer utilities {
  @media (max-width: 64em) {
    .app-canvas {
      padding: 0;
    }

    .app-frame {
      height: 100vh;
      min-height: 100vh;
      max-height: 100vh;
      border: 0;
      border-radius: 0;
    }

    .app-sidebar {
      display: none;
    }

    .mobile-nav {
      display: flex;
    }

    .top-search {
      display: none;
    }
  }

  @media (max-width: 48em) {
    .app-topbar,
    .ant-layout.app-frame .ant-layout-header.app-topbar {
      height: auto;
      min-height: 72px;
      flex-wrap: wrap;
      padding: 12px;
    }

    .top-actions {
      width: 100%;
      justify-content: space-between;
    }

    .user-copy {
      min-width: 0;
    }

    .user-tier {
      display: none;
    }

    .app-content {
      padding: 10px;
    }
  }

  @media (max-width: 36em) {
    .top-title span,
    .user-name {
      display: none;
    }

    .mobile-nav {
      width: 100%;
    }

    .mobile-nav a {
      flex: 1;
      text-align: center;
    }
  }

  @media (max-width: 30em) {
    .dictly-startup-loading__scene {
      inline-size: min(316px, calc(100vw - 48px));
      block-size: 238px;
    }

    .dictly-startup-loading__card {
      min-inline-size: 108px;
      padding: 8px 10px;
    }

    .dictly-startup-loading__card span {
      font-size: 0.74rem;
    }

    .dictly-startup-loading__card--source,
    .dictly-startup-loading__card--zh {
      inset-inline-start: 0;
    }

    .dictly-startup-loading__card--en {
      inset-inline-end: 0;
    }

    .dictly-startup-loading__card--ja {
      inset-inline-end: 12px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      scroll-behavior: auto;
      transition-duration: 0.01ms;
      animation-duration: 0.01ms;
      animation-iteration-count: 1;
    }
  }
}

@keyframes dictly-startup-shell-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dictly-startup-aurora-drift {
  to {
    opacity: 0.94;
    transform: translate(0, 0) scale(1.1);
  }
}

@keyframes dictly-startup-scene-breathe {
  0%,
  100% {
    transform: rotateX(0deg) rotateY(0deg) translateY(0);
  }

  50% {
    transform: rotateX(6deg) rotateY(-7deg) translateY(-8px);
  }
}

@keyframes dictly-startup-scan {
  0% {
    opacity: 0;
    transform: translate3d(-92px, 0, 46px) scaleX(0.32);
  }

  22%,
  72% {
    opacity: 0.86;
  }

  100% {
    opacity: 0;
    transform: translate3d(92px, 0, 46px) scaleX(1);
  }
}

@keyframes dictly-startup-mesh-sweep {
  0% {
    opacity: 0;
    transform: translateX(-110px) skewX(-16deg);
  }

  24%,
  68% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateX(360px) skewX(-16deg);
  }
}

@keyframes dictly-startup-mesh-lane {
  to {
    opacity: 1;
    transform: scaleX(1);
  }
}

@keyframes dictly-startup-dot-pulse {
  to {
    opacity: 0.78;
    transform: scale(1.55);
  }
}

@keyframes dictly-startup-logo-float {
  0%,
  100% {
    transform: translateX(-50%) translateY(0) rotateZ(0deg) scale(1);
  }

  50% {
    transform: translateX(-50%) translateY(-10px) rotateZ(-4deg) scale(1.06);
  }
}

@keyframes dictly-startup-logo-pulse {
  0% {
    opacity: 0.68;
    transform: scale(0.68);
  }

  100% {
    opacity: 0;
    transform: scale(1.45);
  }
}

@keyframes dictly-startup-logo-sheen {
  0% {
    opacity: 0;
    transform: translateX(-92px) rotate(18deg);
  }

  28%,
  68% {
    opacity: 0.92;
  }

  100% {
    opacity: 0;
    transform: translateX(108px) rotate(18deg);
  }
}

@keyframes dictly-startup-card-float {
  0%,
  100% {
    opacity: 0.84;
    transform: translate3d(var(--x), var(--y), var(--z)) rotate(var(--r)) scale(0.97);
  }

  50% {
    opacity: 1;
    transform: translate3d(var(--x2), var(--y2), var(--z)) rotate(var(--r2)) scale(1.04);
  }
}

@keyframes dictly-startup-card-sheen {
  0% {
    opacity: 0;
    transform: translateX(-54px) rotate(16deg);
  }

  32%,
  62% {
    opacity: 0.92;
  }

  100% {
    opacity: 0;
    transform: translateX(164px) rotate(16deg);
  }
}

@keyframes dictly-startup-copy-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@keyframes dictly-startup-orbit-spin {
  to {
    transform: translateX(-50%) rotate(360deg);
  }
}

@keyframes dictly-startup-counter-spin {
  to {
    transform: rotate(-360deg);
  }
}

@keyframes dictly-startup-progress {
  to {
    transform: translateX(76%);
  }
}

@keyframes dictly-startup-progress-dot {
  0% {
    opacity: 0;
    transform: translateX(-18px);
  }

  18%,
  72% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateX(294px);
  }
}
`;
