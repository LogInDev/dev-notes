'use strict';

var classie = require('classie'),
  extend = require('util-extend'),
  domhelper = require('domhelper');

var slimscroll = function(options, elementsArray) {
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
      // 👇 추가: 팝업 window/document 주입용
      doc: null,
    },
    o = extend(defaults, options),
    baseDoc = o.doc || (typeof document === 'object' ? document : null),
    thisElements = elementsArray ? elementsArray : (baseDoc ? baseDoc.querySelectorAll(options.idSelector) : []),
    me, rail, bar, barHeight, minBarHeight = 10,
    mousedownPageY, mousedownT, isDragg, currentBar, currentTouchDif,
    releaseScroll, isOverBar, percentScroll, queueHide, lastScroll, isOverPanel;

  this.init = function() {
    for (var x = 0; x < thisElements.length; x++) {
      var touchDif;
      releaseScroll = false;
      me = thisElements[x];

      // ✅ 이 엘리먼트가 속한 문서를 기준으로 이벤트/생성 처리
      var doc = me && me.ownerDocument ? me.ownerDocument : baseDoc;
      if (!doc) continue;

      classie.addClass(me, o.addedOriginalClass);

      // 이미 래핑되어 있으면 기존 인스턴스 재사용
      if (me.parentNode && classie.hasClass(me.parentNode, o.wrapperClass)) {
        var offset = me.scrollTop;
        bar = me.parentNode.querySelector('.' + o.barClass);
        rail = me.parentNode.querySelector('.' + o.railClass);

        getBarHeight();

        if (typeof options === 'object') {
          if ('height' in options && options.height === 'auto') {
            me.parentNode.style.height = 'auto';
            me.style.height = 'auto';
            var height = me.parentNode.parentNode ? me.parentNode.parentNode.scrollHeight : me.scrollHeight;
            if (me.parentNode) me.parentNode.style.height = height + 'px';
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

      // 높이 계산
      o.height = options.height === 'auto' ? (me.parentNode ? me.parentNode.offsetHeight : me.offsetHeight) : options.height;

      // wrapper
      var wrapper = doc.createElement('div');
      classie.addClass(wrapper, o.wrapperClass);
      wrapper.style.position = 'relative';
      wrapper.style.overflow = 'hidden';
      wrapper.style.width = o.width;
      wrapper.style.height = o.height;

      // 원본 div 스타일
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
      bar.style.zIndex = 99;

      if (o.position === 'right') {
        rail.style.right = o.distance;
        bar.style.right = o.distance;
      } else {
        rail.style.left = o.distance;
        bar.style.left = o.distance;
      }

      domhelper.elementWrap(me, wrapper);
      me.parentNode.appendChild(bar);
      me.parentNode.appendChild(rail);

      getBarHeight();

      // 이벤트: 반드시 ownerDocument 기준
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

      // 크로스 브라우저 휠
      me.addEventListener('DOMMouseScroll', mouseWheelEventHandler, false);
      me.addEventListener('mousewheel', mouseWheelEventHandler, false);

      // 터치 스크롤(문서 기준)
      doc.addEventListener('touchmove', scrollContainerTouchMoveEventHandler, { passive: false });
    }

    // start 위치 처리
    if (o.start === 'bottom') {
      if (bar && me) {
        bar.style.top = (me.offsetHeight - bar.offsetHeight) + 'px';
        scrollContent(0, true);
      }
    } else if (o.start !== 'top') {
      // 오탈자 수정: querSelector -> querySelector
      var target = baseDoc ? baseDoc.querySelector(o.start) : null;
      if (target && target.getBoundingClientRect) {
        var top = target.getBoundingClientRect().top + (baseDoc.defaultView ? baseDoc.defaultView.pageYOffset : 0);
        scrollContent(top, null, true, me);
      }
      if (!o.alwaysVisible && bar) {
        domhelper.elementHideCss(bar);
      }
    }
  }.bind(this);

  function getBarHeight() {
    if (!bar || !me) return;
    barHeight = Math.max((me.offsetHeight / me.scrollHeight) * me.offsetHeight, minBarHeight);
    bar.style.height = barHeight + 'px';
    var display = me.offsetHeight === barHeight ? 'none' : 'block';
    bar.style.display = display;
  }

  function scrollContent(y, isWheel, isJump, element, _bar, isTouch) {
    releaseScroll = false;
    me = element || me;
    if (!me) return;
    var doc = me.ownerDocument || baseDoc;
    bar = me.parentNode ? me.parentNode.querySelector('.' + o.barClass) : _bar;

    var maxTop = me.offsetHeight - (bar ? bar.offsetHeight : 0);
    var delta = y;

    if (isWheel && bar) {
      delta = parseInt(bar.style.top || '0', 10) + ((y * parseInt(o.wheelStep, 10)) / 100) * bar.offsetHeight;
      delta = Math.min(Math.max(delta, 0), maxTop);
      delta = y > 0 ? Math.ceil(delta) : Math.floor(delta);
      bar.style.top = delta + 'px';
    } else if (isTouch && bar) {
      percentScroll = parseInt(bar.style.top || '0', 10) / (me.offsetHeight - bar.offsetHeight);
      delta = percentScroll * (me.scrollHeight - me.offsetHeight);
      bar.style.top = delta + 'px';
    }

    if (bar) {
      percentScroll = parseInt(bar.style.top || '0', 10) / (me.offsetHeight - bar.offsetHeight);
      delta = percentScroll * (me.scrollHeight - me.offsetHeight);
    }

    if (isJump && bar) {
      delta = y;
      var offsetTop = (delta / me.scrollHeight) * me.offsetHeight;
      offsetTop = Math.min(Math.max(offsetTop, 0), maxTop);
      bar.style.top = offsetTop + 'px';
    }

    me.scrollTop = delta;

    // 이벤트 생성도 해당 문서 기준
    var evDoc = me.ownerDocument || baseDoc;
    if (evDoc) {
      var ev = evDoc.createEvent('Event');
      ev.initEvent('slimscrolling', true, true);
      me.dispatchEvent(ev);
    }

    showBar();
    hideBar();
  }

  function showBar() {
    getBarHeight();
    clearTimeout(queueHide);

    if (percentScroll === ~~percentScroll) {
      releaseScroll = o.allowPageScroll;
      if (lastScroll !== percentScroll) {
        var msg = ~~percentScroll === 0 ? 'top' : 'bottom';
        var evDoc = me && (me.ownerDocument || baseDoc);
        if (evDoc) {
          var ev = evDoc.createEvent('Event');
          ev.initEvent('slimscroll', true, true);
          if (me) me.dispatchEvent(ev, msg);
        }
      }
    } else {
      releaseScroll = false;
    }
    lastScroll = percentScroll;

    if (barHeight >= (me ? me.offsetHeight : 0)) {
      releaseScroll = true;
      return;
    }
    if (bar) {
      bar.style.transition = 'opacity .5s';
      bar.style.opacity = o.opacity;
    }
    if (o.railVisible && rail) {
      rail.style.transition = 'opacity .5s'; // transform → transition 수정
      rail.style.opacity = 1;
    }
  }

  function hideBar() {
    if (!o.alwaysVisible) {
      queueHide = setTimeout(function() {
        if (!(o.disableFadeOut && isOverPanel) && !isOverBar && !isDragg) {
          if (bar) {
            bar.style.transition = 'opacity 1s';
            bar.style.opacity = 0;
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
      var el = parentWrapper.querySelector('.' + o.addedOriginalClass + o.idSelector);
      if (el) scrollContent(delta, true, null, el);
    }

    if (!releaseScroll) e.preventDefault();
    e.stopPropagation();
  }

  function mousedownEventHandler(e) {
    currentBar = e.target;
    isDragg = true;
    mousedownT = parseInt(currentBar.style.top || '0', 10);
    mousedownPageY = e.pageY;
    var doc = currentBar.ownerDocument || baseDoc;
    if (doc) doc.addEventListener('mousemove', mousemoveEventHandler);
    e.preventDefault();
    return false;
  }

  function mousemoveEventHandler(e) {
    var currTop = mousedownT + e.pageY - mousedownPageY;
    if (currentBar && me) {
      currentBar.style.top = currTop + 'px';
      scrollContent(0, domhelper.getPosition(currentBar).top, false, me, currentBar, true);
    }
  }

  function mouseupEventHandler(e) {
    isDragg = false;
    if (currentBar) {
      hideBar(currentBar);
      var doc = currentBar.ownerDocument || baseDoc;
      if (doc) doc.removeEventListener('mousemove', mousemoveEventHandler);
    }
  }

  function mouseoverEventHandler() { isOverBar = true; }
  function mouseleaveEventHandler() { isOverBar = false; }
  function selectstartEventHandler() { return false; }

  function railMouseOverEventHandler() { showBar(); }
  function railMouseLeaveEventHandler() { hideBar(); }

  function scrollContainerMouseOverEventHandler() {
    isOverPanel = true;
    showBar(bar);
    hideBar(bar);
  }
  function scrollContainerMouseLeaveEventHandler() {
    // 🛠 버그 수정: mouseleave면 false여야 함
    isOverPanel = false;
    showBar(bar);
    hideBar(bar);
  }

  function scrollContainerTouchStartEventHandler(e) {
    if (e.touches && e.touches.length) {
      currentTouchDif = e.touches[0].pageY;
    }
  }

  function scrollContainerTouchMoveEventHandler(e) {
    if (!releaseScroll) e.preventDefault();
    if (e.touches && e.touches.length && me) {
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