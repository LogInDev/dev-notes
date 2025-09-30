/**
 * Slimscroll (Popup-safe)
 * Based on original code by Yaw Joseph Etse (MIT)
 * Mod: use ownerDocument/defaultView to work in react-new-window popups
 */
'use strict';

var classie = require('classie');
var extend = require('util-extend');
var domhelper = require('domhelper');

var slimscroll = function (options, elementsArray) {
  var defaults = {
    idSelector: 'body',
    width: 'auto',
    height: '250px',
    size: '7px',
    color: '#000',
    position: 'right',
    distance: '1px',
    start: 'top',
    opacity: 0.4,
    alwaysVisible: false,
    disableFadeOut: false,
    railVisible: false,
    railColor: '#333',
    railOpacity: 0.2,
    railDraggable: true,
    railClass: 'slimScrollRail',
    barClass: 'slimScrollBar',
    wrapperClass: 'slimScrollDiv',
    allowPageScroll: false,
    wheelStep: 20,
    touchScrollStep: 200,
    addedOriginalClass: 'originalScrollableElement',
    borderRadius: '7px',
    railBorderRadius: '7px',
  };

  var o = extend(defaults, options);

  // ★ baseDoc/baseWin: elementsArray 기준으로 문서/윈도우 결정
  var _firstEl =
    (elementsArray && elementsArray[0]) ||
    (typeof document !== 'undefined' &&
      document.querySelector &&
      document.querySelector(o.idSelector));
  var baseDoc =
    (_firstEl && _firstEl.ownerDocument) ||
    (typeof document !== 'undefined' ? document : null);
  var baseWin = baseDoc ? baseDoc.defaultView || window : (typeof window !== 'undefined' ? window : null);

  // ★ 기본 요소 선택도 baseDoc 기준으로
  var thisElements =
    elementsArray ||
    (baseDoc ? baseDoc.querySelectorAll(o.idSelector) : []);

  var me, rail, bar, barHeight, minBarHeight = 10;
  var mousedownPageY, mousedownT, isDragg, currentBar, currentTouchDif;
  var releaseScroll, isOverBar, percentScroll, queueHide, lastScroll, isOverPanel;

  this.init = function () {
    for (var x = 0; x < thisElements.length; x++) {
      var divS = '<div></div>';
      releaseScroll = false;

      me = thisElements[x];
      if (!me) continue;

      // ★ 이 요소 기준 문서/윈도우 재계산 (팝업 안전)
      var doc = me.ownerDocument || baseDoc;
      var win = (doc && (doc.defaultView || window)) || baseWin;

      classie.addClass(me, o.addedOriginalClass);

      // 재바인딩 방지
      if (classie.hasClass(me.parentNode, o.wrapperClass)) {
        var offset = me.scrollTop;
        bar = me.parentNode.querySelector('.' + o.barClass);
        rail = me.parentNode.querySelector('.' + o.railClass);

        getBarHeight();

        if (typeof options === 'object') {
          if ('height' in options && options.height === 'auto') {
            me.parentNode.style.height = 'auto';
            me.style.height = 'auto';
            var height = me.parentNode.parentNode.scrollHeight;
            // ★ 오타 수정: me.parent ➜ me.parentNode
            me.parentNode.style.height = height + 'px';
            me.style.height = height + 'px';
          }

          if ('scrollTo' in options) {
            offset = parseInt(o.scrollTo, 10);
          } else if ('scrollBy' in options) {
            offset += parseInt(o.scrollBy, 10);
          } else if ('destroy' in options) {
            domhelper.removeElement(bar);
            domhelper.removeElement(rail);
            domhelper.unwrapElement(me);
            return;
          }

          scrollContent(offset, false, true, me);
        }
        continue;
      }

      // 높이 결정
      o.height = options.height === 'auto' ? me.parentNode.offsetHeight + 'px' : options.height;

      // wrapper 생성
      var wrapper = doc.createElement('div');
      classie.addClass(wrapper, o.wrapperClass);
      wrapper.style.position = 'relative';
      wrapper.style.overflow = 'hidden';
      wrapper.style.width = o.width;
      wrapper.style.height = o.height;

      // 컨테이너 스타일
      me.style.overflow = 'hidden';
      me.style.width = o.width;
      me.style.height = o.height;

      // rail
      rail = doc.createElement('div');
      classie.addClass(rail, o.railClass);
      rail.style.width = o.size;
      rail.style.height = '100%';
      rail.style.position = 'absolute';
      rail.style.top = 0;
      rail.style.display = o.alwaysVisible && o.railVisible ? 'block' : 'none';
      rail.style['border-radius'] = o.railBorderRadius;
      rail.style.background = o.railColor;
      rail.style.opacity = o.railOpacity;
      rail.style.zIndex = 90;

      // bar
      bar = doc.createElement('div');
      classie.addClass(bar, o.barClass);
      bar.style.background = o.color;
      bar.style.width = o.size;
      bar.style.position = 'absolute';
      bar.style.top = 0;
      bar.style.opacity = o.opacity;
      bar.style.display = o.alwaysVisible ? 'block' : 'none';
      bar.style['border-radius'] = o.borderRadius;
      bar.style.BorderRadius = o.borderRadius;
      bar.style.MozBorderRadius = o.borderRadius;
      bar.style.WebkitBorderRadius = o.borderRadius;
      bar.style.zIndex = 99;

      if (o.position === 'right') {
        rail.style.right = o.distance;
        bar.style.right = o.distance;
      } else {
        rail.style.left = o.distance;
        bar.style.left = o.distance;
      }

      // wrap
      domhelper.elementWrap(me, wrapper);

      // append
      me.parentNode.appendChild(bar);
      me.parentNode.appendChild(rail);

      // 초기 bar height
      getBarHeight();

      // 이벤트 바인딩 (★ doc / win 기준)
      bar.addEventListener('mousedown', mousedownEventHandler);
      doc.addEventListener('mouseup', mouseupEventHandler);
      bar.addEventListener('selectstart', selectstartEventHandler);
      bar.addEventListener('mouseover', mouseoverEventHandler);
      bar.addEventListener('mouseleave', mouseleaveEventHandler);
      bar.addEventListener('touchstart', scrollContainerTouchStartEventHandler, { passive: true });

      rail.addEventListener('mouseover', railMouseOverEventHandler);
      rail.addEventListener('mouseleave', railMouseLeaveEventHandler);

      me.addEventListener('mouseover', scrollContainerMouseOverEventHandler);
      me.addEventListener('mouseleave', scrollContainerMouseLeaveEventHandler);
      // ★ 파이어폭스 휠 이벤트
      me.addEventListener('DOMMouseScroll', mouseWheelEventHandler, false);
      me.addEventListener('mousewheel', mouseWheelEventHandler, { passive: false });
    }

    // 시작 위치
    if (o.start === 'bottom') {
      if (bar && me) {
        bar.style.top = (me.offsetHeight - bar.offsetHeight) + 'px';
        scrollContent(0, true);
      }
    } else if (o.start !== 'top') {
      // ★ 오타 수정: querSelector ➜ querySelector
      var startEl = baseDoc && baseDoc.querySelector ? baseDoc.querySelector(o.start) : null;
      if (startEl) {
        scrollContent(domhelper.getPosition(startEl).top, null, true);
        if (!o.alwaysVisible) {
          domhelper.elementHideCss(bar);
        }
      }
    }

    // ★ 터치 이동은 baseDoc 기준으로
    if (baseDoc) {
      baseDoc.addEventListener('touchmove', scrollContainerTouchMoveEventHandler, { passive: false });
    }
  }.bind(this);

  function getBarHeight() {
    if (!bar) bar = currentBar;
    if (!bar || !me) return;

    barHeight = Math.max((me.offsetHeight / me.scrollHeight) * me.offsetHeight, minBarHeight);
    bar.style.height = barHeight + 'px';

    var display = me.offsetHeight === barHeight ? 'none' : 'block';
    bar.style.display = display;
  }

  function scrollContent(y, isWheel, isJump, element, _bar, isTouch) {
    releaseScroll = false;
    var delta = y;
    if (element) me = element;
    var doc = me.ownerDocument || baseDoc;

    var barEl = _bar || (me.parentNode ? me.parentNode.querySelector('.' + o.barClass) : null);
    if (!barEl || !me) return;
    var maxTop = me.offsetHeight - barEl.offsetHeight;

    if (isWheel) {
      delta = parseInt(barEl.style.top || '0', 10) + ((y * parseInt(o.wheelStep, 10)) / 100) * barEl.offsetHeight;
      delta = Math.min(Math.max(delta, 0), maxTop);
      delta = y > 0 ? Math.ceil(delta) : Math.floor(delta);
      barEl.style.top = delta + 'px';
    } else if (isTouch) {
      percentScroll = parseInt(barEl.style.top || '0', 10) / (me.offsetHeight - barEl.offsetHeight);
      delta = percentScroll * (me.scrollHeight - me.offsetHeight);
      barEl.style.top = delta + 'px';
    }

    percentScroll = parseInt(barEl.style.top || '0', 10) / (me.offsetHeight - barEl.offsetHeight);
    delta = percentScroll * (me.scrollHeight - me.offsetHeight);

    if (isJump) {
      delta = y;
      var offsetTop = (delta / me.scrollHeight) * me.offsetHeight;
      offsetTop = Math.min(Math.max(offsetTop, 0), maxTop);
      barEl.style.top = offsetTop + 'px';
    }

    me.scrollTop = delta;

    // 커스텀 이벤트
    var newevent = (doc && doc.createEvent) ? doc.createEvent('Event') : null;
    if (newevent) {
      newevent.initEvent('slimscrolling', true, true);
      try { me.dispatchEvent(newevent); } catch (err) {}
    }

    showBar(barEl);
    hideBar(barEl);
  }

  function showBar(barEl) {
    getBarHeight();
    clearTimeout(queueHide);

    if (percentScroll === ~~percentScroll) {
      releaseScroll = o.allowPageScroll;
      if (lastScroll !== percentScroll) {
        var msg = ~~percentScroll === 0 ? 'top' : 'bottom';
        var doc = me.ownerDocument || baseDoc;
        var newevent = (doc && doc.createEvent) ? doc.createEvent('Event') : null;
        if (newevent) {
          newevent.initEvent('slimscroll', true, true);
          try { me.dispatchEvent(newevent); } catch (err) {}
        }
      }
    } else {
      releaseScroll = false;
    }
    lastScroll = percentScroll;

    if (barHeight >= me.offsetHeight) {
      releaseScroll = true;
      return;
    }
    var _bar = barEl || bar;
    if (_bar) {
      _bar.style.transition = 'opacity .5s';
      _bar.style.opacity = o.opacity;
    }
    if (rail && o.railVisible) {
      rail.style.transform = 'opacity .5s';
      rail.style.opacity = 1;
    }
  }

  function hideBar(barEl) {
    if (!o.alwaysVisible) {
      queueHide = setTimeout(function () {
        if (!(o.disableFadeOut && isOverPanel) && !isOverBar && !isDragg) {
          var _bar = barEl || bar;
          if (_bar) {
            _bar.style.transition = 'opacity 1s';
            _bar.style.opacity = 0;
          }
          if (rail) {
            rail.style.transition = 'opacity 1s';
            rail.style.opacity = 0;
          }
        }
      }, 500);
    }
  }

  function mouseWheelEventHandler(e) {
    if (!isOverPanel) return;

    var delta = 0;
    if (e.wheelDelta) delta = -e.wheelDelta / 120;
    if (e.detail) delta = e.detail / 3;

    var target = e.target;
    var parentWrapper = domhelper.getParentElement(target, o.wrapperClass);
    if (parentWrapper) {
      var content = parentWrapper.querySelector('.' + o.addedOriginalClass + o.idSelector) || me;
      scrollContent(delta, true, null, content);
    }

    if (!releaseScroll) {
      e.preventDefault();
    }
    e.stopPropagation();
  }

  function mousedownEventHandler(e) {
    currentBar = e.target;
    isDragg = true;
    mousedownT = parseInt(currentBar.style.top || '0', 10);
    mousedownPageY = e.pageY;
    if (currentBar) {
      (currentBar.ownerDocument || baseDoc).addEventListener('mousemove', mousemoveEventHandler);
    }
    e.preventDefault();
    return false;
  }

  function mousemoveEventHandler(e) {
    var doc = currentBar ? currentBar.ownerDocument : baseDoc;
    var currTop = mousedownT + e.pageY - mousedownPageY;
    if (currentBar) {
      currentBar.style.top = currTop + 'px';
      scrollContent(0, domhelper.getPosition(currentBar).top, false, me, currentBar, true);
    }
  }

  function mouseupEventHandler() {
    isDragg = false;
    if (currentBar) {
      hideBar(currentBar);
      (currentBar.ownerDocument || baseDoc).removeEventListener('mousemove', mousemoveEventHandler);
    }
  }

  function mouseoverEventHandler() { isOverBar = true; }
  function mouseleaveEventHandler() { isOverBar = false; }
  function selectstartEventHandler() { return false; }

  function railMouseOverEventHandler() { showBar(); }
  function railMouseLeaveEventHandler() { hideBar(); }

  function scrollContainerMouseOverEventHandler() {
    isOverPanel = true; showBar(bar); hideBar(bar);
  }
  function scrollContainerMouseLeaveEventHandler() {
    isOverPanel = false; hideBar(bar);
  }

  function scrollContainerTouchStartEventHandler(e) {
    if (e.touches && e.touches.length) {
      currentTouchDif = e.touches[0].pageY;
    }
  }

  function scrollContainerTouchMoveEventHandler(e) {
    if (!releaseScroll) e.preventDefault();
    if (e.touches && e.touches.length) {
      var diff = (currentTouchDif - e.touches[0].pageY) / o.touchScrollStep;
      scrollContent(diff, true, null, me, currentBar, true);
      currentTouchDif = e.touches[0].pageY;
    }
  }
};

module.exports = slimscroll;

if (typeof window === 'object' && typeof window.document === 'object') {
  window.slimscroll = slimscroll;
}