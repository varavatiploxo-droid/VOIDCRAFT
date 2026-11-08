(() => {
  "use strict";

  const menuButton = document.querySelector("button.menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const closeMenu = document.querySelector(".close-menu");

  const setMenuState = (open) => {
    if (!menuButton || !mobileMenu) return;
    menuButton.classList.toggle("is-active", open);
    mobileMenu.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded", String(open));
  };

  if (menuButton && mobileMenu) {
    menuButton.setAttribute("aria-controls", "mobile-menu");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.addEventListener("click", (event) => {
      event.preventDefault();
      setMenuState(!mobileMenu.classList.contains("open"));
    });
  }

  closeMenu?.addEventListener("click", (event) => {
    event.preventDefault();
    setMenuState(false);
  });

  const authModal = document.getElementById("login-modal");
  const authShadow = document.querySelector("[data-auth-shadow]");
  const authClose = authModal?.querySelector("[data-auth-close]");
  const authCheckTerms = document.getElementById("login-modal-check-1");
  const authCheckAge = document.getElementById("login-modal-check-2");
  const authButton = document.getElementById("login-modal-auth-btn");
  const authTriggerSelector = '[data-auth-modal="#login-modal"], a.steam-auth-btn, [data-live-drop-auth]';
  const authContainerControlSelector = [
    "[data-auth-container] button",
    "[data-auth-container] a",
    "[data-auth-container] input",
    "[data-auth-container] select",
    '[data-auth-container] [role="button"]',
  ].join(", ");
  const caseAssetSelector = ".case-assets > .wrapper > .unit";
  const nestedInteractiveSelector = 'a, button, input, select, textarea, [contenteditable="true"]';
  const staticModalTriggerSelector = "[data-static-modal]";
  const staticModalCloseSelector = "[data-static-modal-close]";
  const authTriggers = [...document.querySelectorAll(`${authTriggerSelector}, ${authContainerControlSelector}`)];
  let authReturnFocus = null;
  let authScrollY = 0;
  let activeStaticModal = null;
  let staticModalReturnFocus = null;
  let staticModalScrollY = 0;

  const updateAuthButton = () => {
    if (!authButton || !authCheckTerms || !authCheckAge) return;
    const enabled = authCheckTerms.checked && authCheckAge.checked;
    authButton.disabled = !enabled;
    authButton.classList.toggle("disabled", !enabled);
  };

  const setAuthModalState = (open) => {
    if (!authModal) return;
    authModal.classList.toggle("hystmodal--active", open);
    authModal.setAttribute("aria-hidden", String(!open));
    authShadow?.classList.toggle("hystmodal__shadow--show", open);
    authShadow?.setAttribute("aria-hidden", String(!open));

    if (open) {
      authReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      authScrollY = window.scrollY;
      document.documentElement.classList.add("hystmodal__opened");
      document.documentElement.style.top = `-${authScrollY}px`;
      setMenuState(false);
      updateAuthButton();
      authClose?.focus();
      return;
    }

    document.documentElement.classList.remove("hystmodal__opened");
    document.documentElement.style.removeProperty("top");
    window.scrollTo(0, authScrollY);
    authReturnFocus?.focus();
    authReturnFocus = null;
  };

  const prepareAuthTrigger = (trigger) => {
    if (!(trigger instanceof HTMLElement)) return;
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", "login-modal");
    if (!trigger.matches("a[href], button, input, select, textarea, summary") && !trigger.hasAttribute("tabindex")) {
      trigger.setAttribute("role", "button");
      trigger.tabIndex = 0;
    }
  };

  for (const trigger of authTriggers) {
    prepareAuthTrigger(trigger);
  }

  authClose?.addEventListener("click", () => setAuthModalState(false));
  authModal?.addEventListener("click", (event) => {
    if (event.target === authModal || event.target === authModal.querySelector(".hystmodal__wrap")) {
      setAuthModalState(false);
    }
  });

  authCheckTerms?.addEventListener("change", updateAuthButton);
  authCheckAge?.addEventListener("change", updateAuthButton);
  authButton?.addEventListener("click", () => {
    if (authButton.disabled) return;
    const returnTarget = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/openId.php?action=login&return=${encodeURIComponent(returnTarget)}`);
  });

  const modalIdFromControl = (control, attributeName) => {
    const rawReference = control.getAttribute(attributeName)
      || control.getAttribute("aria-controls")
      || (control.matches("a[href^='#']") ? control.getAttribute("href") : "");
    const modalId = rawReference?.trim().replace(/^#/, "");
    return modalId && /^[A-Za-z][\w:.-]*$/.test(modalId) ? modalId : "";
  };

  const staticModalFromControl = (control, attributeName) => {
    const modalId = modalIdFromControl(control, attributeName);
    if (modalId) return document.getElementById(modalId);
    return attributeName === "data-static-modal-close"
      ? control.closest(".hystmodal, .light-modal")
      : null;
  };

  const setStaticModalState = (modal, open) => {
    if (!(modal instanceof HTMLElement)) return;

    const usesSharedShadow = !modal.classList.contains("light-modal");
    const stateClass = usesSharedShadow ? "hystmodal--active" : "visible";
    modal.classList.toggle(stateClass, open);
    modal.setAttribute("aria-hidden", String(!open));

    if (open) {
      if (activeStaticModal && activeStaticModal !== modal) setStaticModalState(activeStaticModal, false);
      activeStaticModal = modal;
      staticModalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      staticModalScrollY = window.scrollY;
      if (usesSharedShadow) {
        authShadow?.classList.add("hystmodal__shadow--show");
        authShadow?.setAttribute("aria-hidden", "false");
      }
      document.documentElement.classList.add("hystmodal__opened");
      document.documentElement.style.top = `-${staticModalScrollY}px`;
      setMenuState(false);

      const focusTarget = modal.querySelector([
        "[autofocus]",
        staticModalCloseSelector,
        "button:not([disabled])",
        "a[href]",
        "input:not([disabled]):not([type='hidden'])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        '[tabindex]:not([tabindex="-1"])',
      ].join(", "));
      if (focusTarget instanceof HTMLElement) focusTarget.focus();
      return;
    }

    if (activeStaticModal !== modal) return;
    activeStaticModal = null;
    if (usesSharedShadow) {
      authShadow?.classList.remove("hystmodal__shadow--show");
      authShadow?.setAttribute("aria-hidden", "true");
    }
    document.documentElement.classList.remove("hystmodal__opened");
    document.documentElement.style.removeProperty("top");
    window.scrollTo(0, staticModalScrollY);
    staticModalReturnFocus?.focus();
    staticModalReturnFocus = null;
  };

  const activateAuthGate = (trigger, event) => {
    if (!authModal) return;
    event.preventDefault();
    if (authModal.classList.contains("hystmodal--active")) return;

    let returnFocus = trigger instanceof HTMLElement ? trigger : null;
    if (activeStaticModal) {
      returnFocus = staticModalReturnFocus || returnFocus;
      setStaticModalState(activeStaticModal, false);
    }
    returnFocus?.focus({ preventScroll: true });
    setAuthModalState(true);
  };

  const caseAssetFromTarget = (target) => {
    if (!(target instanceof Element)) return null;
    const card = target.closest(caseAssetSelector);
    if (!card || !card.parentElement?.matches(".case-assets > .wrapper")) return null;
    const nestedControl = target.closest(nestedInteractiveSelector);
    return nestedControl && card.contains(nestedControl) ? null : card;
  };

  const authControlFromTarget = (target) => {
    if (!(target instanceof Element)) return null;
    const explicitTrigger = target.closest(authTriggerSelector);
    if (explicitTrigger) return explicitTrigger;
    return target.closest(authContainerControlSelector);
  };

  const handleStaticModalControl = (control, event) => {
    const isClose = control.matches(staticModalCloseSelector);
    const modal = staticModalFromControl(
      control,
      isClose ? "data-static-modal-close" : "data-static-modal",
    );
    if (!modal) return false;
    event.preventDefault();
    if (!isClose && activeStaticModal === modal) return true;
    if (!isClose && control instanceof HTMLElement) control.focus({ preventScroll: true });
    setStaticModalState(modal, !isClose);
    return true;
  };

  const handleAuthGateClick = (event) => {
    if (!(event.target instanceof Element)) return;

    const staticModalControl = event.target.closest(`${staticModalCloseSelector}, ${staticModalTriggerSelector}`);
    if (staticModalControl) {
      handleStaticModalControl(staticModalControl, event);
      return;
    }

    if (activeStaticModal && (
      event.target === activeStaticModal
      || event.target === activeStaticModal.querySelector(".hystmodal__wrap")
    )) {
      event.preventDefault();
      setStaticModalState(activeStaticModal, false);
      return;
    }

    const authControl = authControlFromTarget(event.target);
    if (authControl) {
      prepareAuthTrigger(authControl);
      activateAuthGate(authControl, event);
      return;
    }

    const caseAsset = caseAssetFromTarget(event.target);
    if (caseAsset) activateAuthGate(caseAsset, event);
  };

  const handleAuthGateKeydown = (event) => {
    if (event.repeat || !["Enter", " ", "Spacebar"].includes(event.key)) return;
    if (!(event.target instanceof Element)) return;

    const staticModalControl = event.target.closest(`${staticModalCloseSelector}, ${staticModalTriggerSelector}`);
    if (staticModalControl) {
      handleStaticModalControl(staticModalControl, event);
      return;
    }

    const authControl = authControlFromTarget(event.target);
    if (authControl) {
      prepareAuthTrigger(authControl);
      activateAuthGate(authControl, event);
      return;
    }

    const caseAsset = caseAssetFromTarget(event.target);
    if (caseAsset && event.target === caseAsset) activateAuthGate(caseAsset, event);
  };

  document.addEventListener("click", handleAuthGateClick);
  document.addEventListener("keydown", handleAuthGateKeydown);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (activeStaticModal) setStaticModalState(activeStaticModal, false);
    else if (authModal?.classList.contains("hystmodal--active")) setAuthModalState(false);
    setMenuState(false);
  });

  authShadow?.addEventListener("click", () => {
    if (activeStaticModal) setStaticModalState(activeStaticModal, false);
    else setAuthModalState(false);
  });

  const promoCountdown = document.getElementById("promocode-countdown");
  if (promoCountdown) {
    let remaining = Number(promoCountdown.dataset.duration || 310);
    const countdownParts = [...promoCountdown.querySelectorAll(":scope > span")];
    const renderCountdown = () => {
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      const values = [hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
      countdownParts.forEach((part, index) => {
        part.textContent = values[index];
      });
      remaining = remaining > 0 ? remaining - 1 : Number(promoCountdown.dataset.duration || 310);
    };
    renderCountdown();
    window.setInterval(renderCountdown, 1000);
  }

  const questions = [...document.querySelectorAll(".question-list > li")];
  const updateQuestions = (selected) => {
    for (const item of questions) {
      const content = item.querySelector(".__tab__content");
      if (!content) continue;
      const isOpen = item === selected;
      item.classList.toggle("__tab__open", isOpen);
      content.style.maxHeight = isOpen ? `${content.scrollHeight}px` : "0px";
      item.querySelector("h3")?.setAttribute("aria-expanded", String(isOpen));
    }
  };

  for (const item of questions) {
    const heading = item.querySelector("h3");
    if (!heading) continue;
    heading.setAttribute("role", "button");
    heading.setAttribute("tabindex", "0");
    const activate = () => updateQuestions(item.classList.contains("__tab__open") ? null : item);
    heading.addEventListener("click", activate);
    heading.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  }

  if (questions.length) {
    updateQuestions(questions.find((item) => item.classList.contains("__tab__open")) || questions[0]);
  }

  const searchInput = document.querySelector('#filter input[type="search"]');
  const caseCards = [...document.querySelectorAll("#caseList > a[data-title]")];
  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLocaleLowerCase("ru");
    for (const card of caseCards) {
      const title = (card.dataset.title || "").toLocaleLowerCase("ru");
      card.hidden = query.length > 0 && !title.includes(query);
    }
  });

  const sort = document.querySelector(".case-assets .sort");
  const sortButton = sort?.querySelector(".current");
  const sortOptions = sort?.querySelector(".options");
  const assetWrapper = document.querySelector(".case-assets > .wrapper");

  if (assetWrapper) {
    for (const card of assetWrapper.querySelectorAll(":scope > .unit")) {
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-haspopup", "dialog");
      card.setAttribute("aria-controls", "login-modal");

      if (!card.hasAttribute("aria-label")) {
        const title = card.querySelector(".unit-title")?.textContent.replace(/\s+/g, " ").trim()
          || card.querySelector("img:not(.collection)")?.getAttribute("alt")?.trim();
        card.setAttribute("aria-label", title ? `Авторизоваться через Steam: ${title}` : "Авторизоваться через Steam");
      }
    }
  }

  if (sort && sortButton && sortOptions && assetWrapper) {
    sortOptions.hidden = true;
    sortButton.addEventListener("click", () => {
      const open = sortOptions.hidden;
      sortOptions.hidden = !open;
      sortButton.setAttribute("aria-expanded", String(open));
    });

    for (const option of sortOptions.querySelectorAll("[data-sort]")) {
      option.addEventListener("click", () => {
        const mode = Number(option.dataset.sort);
        const items = [...assetWrapper.querySelectorAll(":scope > .unit")];
        items.sort((left, right) => {
          if (mode === 1) return Number(left.dataset.price) - Number(right.dataset.price);
          if (mode === 2) return Number(right.dataset.price) - Number(left.dataset.price);
          return Number(left.dataset.order) - Number(right.dataset.order);
        });
        for (const item of items) assetWrapper.append(item);
        for (const item of sortOptions.querySelectorAll("[data-sort]")) {
          item.classList.toggle("active", item === option);
          item.setAttribute("aria-selected", String(item === option));
        }
        sortButton.querySelector("span").textContent = option.textContent.trim();
        sortOptions.hidden = true;
        sortButton.setAttribute("aria-expanded", "false");
      });
    }
  }

  const liveDrops = document.querySelector("#live-drops > div");
  if (liveDrops) {
    const batchDuration = 3000;
    const batchSize = 12;
    const slideDuration = 400;
    const seedItems = [...liveDrops.querySelectorAll(":scope > .item")].slice(0, batchSize);
    const templates = seedItems.map((item) => item.cloneNode(true));
    let liveDropId = Date.now();
    let liveDropsPointerHovered = false;
    let liveDropsFocused = false;
    let liveDropsVisible = true;
    let batchTimer = 0;
    let itemTimer = 0;

    const cubicOut = (value) => {
      const shifted = value - 1;
      return (shifted * shifted * shifted) + 1;
    };

    const numberStyle = (style, property) => Number.parseFloat(style[property]) || 0;

    const readSlideMetrics = (item) => {
      const style = window.getComputedStyle(item);
      return {
        opacity: Number.parseFloat(style.opacity) || 1,
        height: numberStyle(style, "height"),
        paddingTop: numberStyle(style, "paddingTop"),
        paddingBottom: numberStyle(style, "paddingBottom"),
        marginTop: numberStyle(style, "marginTop"),
        marginBottom: numberStyle(style, "marginBottom"),
        borderTopWidth: numberStyle(style, "borderTopWidth"),
        borderBottomWidth: numberStyle(style, "borderBottomWidth"),
      };
    };

    const writeSlideFrame = (item, metrics, amount) => {
      item.style.overflow = "hidden";
      item.style.opacity = String(Math.min(20 * amount, 1) * metrics.opacity);
      item.style.height = `${amount * metrics.height}px`;
      item.style.paddingTop = `${amount * metrics.paddingTop}px`;
      item.style.paddingBottom = `${amount * metrics.paddingBottom}px`;
      item.style.marginTop = `${amount * metrics.marginTop}px`;
      item.style.marginBottom = `${amount * metrics.marginBottom}px`;
      item.style.borderTopWidth = `${amount * metrics.borderTopWidth}px`;
      item.style.borderBottomWidth = `${amount * metrics.borderBottomWidth}px`;
    };

    const clearSlideStyles = (item) => {
      for (const property of [
        "overflow",
        "opacity",
        "height",
        "paddingTop",
        "paddingBottom",
        "marginTop",
        "marginBottom",
        "borderTopWidth",
        "borderBottomWidth",
      ]) {
        item.style[property] = "";
      }
    };

    const runSlide = (item, metrics, opening, complete) => {
      const startedAt = window.performance.now();
      item.classList.add("live-drop-sliding");
      writeSlideFrame(item, metrics, opening ? 0 : 1);

      const frame = (now) => {
        const progress = Math.min((now - startedAt) / slideDuration, 1);
        const eased = cubicOut(progress);
        writeSlideFrame(item, metrics, opening ? eased : 1 - eased);

        if (progress < 1) {
          window.requestAnimationFrame(frame);
          return;
        }

        clearSlideStyles(item);
        item.classList.remove("live-drop-sliding");
        complete?.();
      };

      window.requestAnimationFrame(frame);
    };

    const revealImage = (image) => {
      image.classList.remove("loaded");
      const reveal = () => window.requestAnimationFrame(() => image.classList.add("loaded"));
      if (image.complete && image.naturalWidth > 0) reveal();
      else image.addEventListener("load", reveal, { once: true });
    };

    const hydrateHoverImages = (item) => {
      const caseThumb = item.querySelector(".drop-thumb[data-case-image]");
      if (caseThumb && !caseThumb.querySelector("img")) {
        const image = document.createElement("img");
        image.src = caseThumb.dataset.caseImage;
        image.alt = caseThumb.title;
        image.title = caseThumb.title;
        caseThumb.append(image);
      }

      const userThumb = item.querySelector(".user-thumb[data-avatar]");
      if (userThumb && !userThumb.querySelector("img")) {
        const image = document.createElement("img");
        image.src = userThumb.dataset.avatar;
        image.alt = "Игрок Case-Battle";
        image.title = "Игрок Case-Battle";
        userThumb.append(image);
      }
    };

    const setupDropItem = (item, animateImage = false) => {
      if (!item.dataset.liveDropId) item.dataset.liveDropId = String(++liveDropId);
      const dropImage = item.querySelector(".drop-image");
      if (dropImage) {
        if (animateImage) revealImage(dropImage);
        else if (dropImage.complete && dropImage.naturalWidth > 0) dropImage.classList.add("loaded");
        else dropImage.addEventListener("load", () => dropImage.classList.add("loaded"), { once: true });
      }

      item.addEventListener("mouseenter", () => {
        liveDropsPointerHovered = true;
        hydrateHoverImages(item);
      });

      item.addEventListener("mouseleave", () => {
        liveDropsPointerHovered = false;
      });

      item.addEventListener("focusin", () => {
        liveDropsFocused = true;
        hydrateHoverImages(item);
        window.setTimeout(() => {
          if (item.matches(":focus-within")) item.classList.add("is-focused");
        }, 0);
      });

      item.addEventListener("focusout", () => {
        liveDropsFocused = false;
        item.classList.remove("is-focused");
      });

    };

    const removeDropItem = (item) => {
      if (item.classList.contains("live-drop-exiting")) return;
      item.classList.add("live-drop-exiting");
      const metrics = readSlideMetrics(item);
      runSlide(item, metrics, false, () => {
        if (item.matches(":hover")) liveDropsPointerHovered = false;
        if (item.matches(":focus-within")) liveDropsFocused = false;
        item.remove();
      });
    };

    const trimLiveDrops = () => {
      const currentItems = [...liveDrops.querySelectorAll(":scope > .item:not(.live-drop-exiting)")];
      for (const item of currentItems.slice(batchSize)) removeDropItem(item);
    };

    const prependDrop = (template) => {
      const reference = liveDrops.querySelector(":scope > .item:not(.live-drop-exiting):not(.live-drop-sliding)");
      if (!reference) return;
      const metrics = readSlideMetrics(reference);
      const item = template.cloneNode(true);
      item.dataset.liveDropId = String(++liveDropId);
      setupDropItem(item, true);
      writeSlideFrame(item, metrics, 0);
      liveDrops.prepend(item);
      runSlide(item, metrics, true);
    };

    const shuffledBatch = () => [...templates]
      .sort(() => Math.random() - 0.5)
      .slice(0, batchSize);

    const scheduleBatch = (delay = 0) => {
      window.clearTimeout(batchTimer);
      batchTimer = window.setTimeout(() => {
        if (document.hidden || !liveDropsVisible) {
          scheduleBatch(batchDuration);
          return;
        }

        trimLiveDrops();
        const batch = shuffledBatch();
        const step = batchDuration / batch.length;
        let index = 0;

        const next = () => {
          const template = batch[index];
          index += 1;
          if (!liveDropsPointerHovered && !liveDropsFocused && template) prependDrop(template);

          if (index < batch.length) itemTimer = window.setTimeout(next, step);
          else scheduleBatch(0);
        };

        itemTimer = window.setTimeout(next, step);
      }, delay);
    };

    for (const item of liveDrops.querySelectorAll(":scope > .item")) setupDropItem(item);

    if ("IntersectionObserver" in window) {
      const liveDropsObserver = new IntersectionObserver(([entry]) => {
        liveDropsVisible = Boolean(entry?.isIntersecting);
      });
      liveDropsObserver.observe(liveDrops);
    }

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && liveDropsVisible) scheduleBatch(250);
      else window.clearTimeout(itemTimer);
    });

    scheduleBatch(250);
  }
})();
