console.log('北森生涯教育平台视频自动播放扩展已加载');

// 自动播放所有视频
function enableAutoplay() {
  // 获取页面上所有视频元素
  const videos = document.querySelectorAll('video');
  console.log(`找到 ${videos.length} 个视频元素`);
  
  videos.forEach((video, index) => {
    // 设置自动播放属性
    video.autoplay = true;
    
    // 大多数浏览器需要静音才允许自动播放
    video.muted = true;
    
    // 若视频已暂停，则播放
    if (video.paused) {
      video.play().catch(e => console.log(`视频 ${index} 自动播放失败:`, e));
    }
    
    // 移除循环播放设置
    video.loop = false;
    
    // 移除之前可能添加的ended事件监听器
    video.removeEventListener('ended', videoEndedHandler);
    
    // 添加结束事件监听器，尝试查找并点击"下一个"按钮
    video.addEventListener('ended', videoEndedHandler);
    
    console.log(`已启用视频 ${index} 的自动播放`);
  });
}

// 视频结束时处理函数
function videoEndedHandler() {
  console.log('视频播放结束，尝试跳转到下一个视频');
  
  // 延迟两秒执行，等待页面可能的状态更新
  setTimeout(() => {
    // 针对 careersky.cn 的特定选择器
    const careerSkySelectors = [
      // 基于你提供的URL，尝试一些可能的选择器
      '.next-lesson-btn',
      '.nextBtn',
      '.btn-next',
      'button[data-action="next"]',
      '.vod-next-btn',
      // 通用选择器
      'button.next-video', 
      'a.next-video',
      'button[title*="下一个"]', 
      'button[aria-label*="下一个"]',
      '.next-btn', 
      '.next',
      '[class*="next"]',
      '.icon-next',
      '.next-icon',
      // 文本匹配
      'button:contains("下一")',
      'a:contains("下一")',
      'button:contains("next")',
      'a:contains("next")'
    ];
    
    // 依次尝试每个选择器
    for (const selector of careerSkySelectors) {
      try {
        // 使用querySelectorAll获取所有匹配的元素
        const nextButtons = document.querySelectorAll(selector);
        if (nextButtons && nextButtons.length > 0) {
          // 遍历所有匹配元素，查找可见的按钮
          for (const btn of nextButtons) {
            if (isElementVisible(btn)) {
              console.log(`找到可见的下一个按钮: ${selector}`);
              btn.click();
              return;
            }
          }
        }
      } catch (error) {
        console.log(`尝试选择器 ${selector} 失败: ${error.message}`);
      }
    }
    
    // 如果找不到下一个按钮，尝试其他策略
    // 基于提供的URL模式分析
    const currentUrl = window.location.href;
    
    // 例如 #20:81:1 这种格式，尝试增加最后一个数字
    const hashMatch = currentUrl.match(/#(\d+):(\d+):(\d+)/);
    if (hashMatch) {
      const part1 = parseInt(hashMatch[1]);
      const part2 = parseInt(hashMatch[2]);
      const part3 = parseInt(hashMatch[3]) + 1;
      const newHash = `#${part1}:${part2}:${part3}`;
      const nextUrl = currentUrl.replace(/#\d+:\d+:\d+/, newHash);
      console.log(`尝试通过URL哈希跳转到下一个视频: ${nextUrl}`);
      window.location.href = nextUrl;
      return;
    }
    
    // 通用数字匹配
    const urlMatch = currentUrl.match(/(\d+)/g);
    if (urlMatch && urlMatch.length > 0) {
      const lastNumber = urlMatch[urlMatch.length - 1];
      const nextNum = parseInt(lastNumber) + 1;
      const nextUrl = currentUrl.replace(new RegExp(lastNumber + "($|[^\\d])"), nextNum + "$1");
      console.log(`尝试通过URL跳转到下一个视频: ${nextUrl}`);
      window.location.href = nextUrl;
      return;
    }
    
    console.log('无法找到跳转到下一个视频的方法');
  }, 2000);  // 增加延迟时间到2秒
}

// 检查元素是否可见
function isElementVisible(element) {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  
  const rect = element.getBoundingClientRect();
  // 元素至少有一部分在可视区域内
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.left <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// 防止系统休眠
function preventSleep() {
  try {
    // 尝试使用 Wake Lock API 保持屏幕唤醒
    if ('wakeLock' in navigator) {
      // 请求屏幕锁以防止系统进入睡眠状态
      navigator.wakeLock.request('screen').then(wakeLock => {
        console.log('屏幕锁定成功，防止系统休眠');
        // 页面可见性改变时重新请求锁
        document.addEventListener('visibilitychange', async () => {
          if (document.visibilityState === 'visible') {
            navigator.wakeLock.request('screen').catch(e => {
              console.log('重新请求屏幕锁失败:', e);
            });
          }
        });
      }).catch(e => {
        console.log('请求屏幕锁失败:', e);
      });
    } else {
      // 备用方法：创建一个不可见的视频以保持活动状态
      const noSleepVideo = document.createElement('video');
      noSleepVideo.setAttribute('loop', '');
      noSleepVideo.setAttribute('playsinline', '');
      noSleepVideo.setAttribute('muted', '');
      noSleepVideo.setAttribute('width', '1');
      noSleepVideo.setAttribute('height', '1');
      noSleepVideo.style.position = 'absolute';
      noSleepVideo.style.left = '-1px';
      noSleepVideo.style.top = '-1px';
      
      // 创建一个简单的视频源
      const source = document.createElement('source');
      // 使用 data URL 创建一个最小的视频
      source.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA7RtZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlM2E1OTk0YiAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTcgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0xIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDM6MHgxMTMgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTEgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MyBiX3B5cmFtaWQ9MiBiX2FkYXB0PTEgYl9iaWFzPTAgZGlyZWN0PTEgd2VpZ2h0Yj0xIG9wZW5fZ29wPTAgd2VpZ2h0cD0yIGtleWludD0yNTAga2V5aW50X21pbj0yMCBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmNfbG9va2FoZWFkPTQwIHJjPWNyZiBtYnRyZWU9MSBjcmY9MjMuMCBxY29tcD0wLjYwIHFwbWluPTAgcXBtYXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAJZliIQAJ//+8dzwKZrlxoFv1ZXWQmej4TACgAAAAwAAAwAAP/738H774dXGdQ6XMI8YjUjfTpyy2fFJYO4vAAAAAwAAAwAAAwAAAwAAP3AAAAAKAAAAwAAAwAAADJYBACcWWIhAAEABIL0AQEWp/NSj3j/dIwAAAAMAAAMAAAMAAAMAAAMAAAMAAAMAPyAAAAAKAAAAwAAAwAAA8gAATZliIQABAAEgvQBARan81KPeP90jAAAAAwAAAwAAAwAAAwAAAwAAAwAAAwA/IAAAABsAAAAQAAAAGAAAAwAAEqAATpliIQABAAEgvQBARan81KPeP90jAAAAAwAAAwAAAwAAAwAAAwAAAwAAAwA/IAAAAAoAAADAAADAAADyAABPmWIhAAEAASC9AEBFqfzUo94/3SMAAAADAAADAAADAAADAAADAAADAAADADxAAAAAFAAAAwAAAwAAAwAAAwAAEqAA';
      noSleepVideo.appendChild(source);
      document.body.appendChild(noSleepVideo);
      
      // 播放视频
      noSleepVideo.play().catch(e => {
        console.log('防止休眠的视频播放失败:', e);
      });
    }
  } catch (e) {
    console.log('设置防止休眠失败:', e);
  }
}

// 拦截视频播放器API
function interceptPlayerAPI() {
  try {
    // 重写所有视频元素的暂停方法
    const originalPlay = HTMLVideoElement.prototype.play;
    const originalPause = HTMLVideoElement.prototype.pause;
    
    // 如果视频结束了，允许暂停；否则阻止暂停
    HTMLVideoElement.prototype.pause = function() {
      if (this.ended) {
        return originalPause.apply(this, arguments);
      }
      console.log('拦截到暂停请求，已阻止');
      return undefined;
    };
    
    // 增强播放功能
    HTMLVideoElement.prototype.play = function() {
      console.log('增强播放请求');
      return originalPlay.apply(this, arguments)
        .catch(error => {
          console.log('播放失败，重试中...', error);
          // 静音后重试（解决大多数自动播放限制）
          this.muted = true;
          return originalPlay.apply(this, arguments);
        });
    };
    
    console.log('已拦截视频API');
  } catch (e) {
    console.log('拦截视频API失败:', e);
  }
}

// 增强版的移除页面可见性检测函数
function removeVisibilityChangeListeners() {
  // 保存原始方法
  const originalAddEventListener = document.addEventListener;
  const originalRemoveEventListener = document.removeEventListener;
  
  // 拦截所有可能导致视频暂停的事件
  const eventsToBlock = [
    'visibilitychange', 
    'webkitvisibilitychange', 
    'mozvisibilitychange',
    'pagehide', 
    'blur',
    'freeze'
  ];
  
  // 重写addEventListener方法，拦截相关事件
  document.addEventListener = function(type, listener, options) {
    if (eventsToBlock.includes(type)) {
      console.log(`已阻止添加${type}监听器`);
      return;
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
  
  // 重写removeEventListener方法，保持一致性
  document.removeEventListener = function(type, listener, options) {
    if (eventsToBlock.includes(type)) {
      console.log(`已阻止移除${type}监听器`);
      return;
    }
    return originalRemoveEventListener.call(this, type, listener, options);
  };
  
  
  // 重写document.webkitHidden属性，使其始终返回false（Safari支持）
  Object.defineProperty(document, 'webkitHidden', {
    get: function() {
      return false;
    }
  });
  
  // 创建一个监视所有视频元素的函数，确保它们不会被暂停
  function keepVideosPlaying() {
    const videos = document.querySelectorAll('video');
    videos.forEach((video, index) => {
      if (video.paused && !video.ended && video.currentTime > 0) {
        console.log(`检测到视频 ${index} 被暂停，尝试恢复播放`);
        video.play().catch(e => console.log(`恢复视频 ${index} 播放失败:`, e));
      }
    });
  }
  
  // 定期检查视频状态
  setInterval(keepVideosPlaying, 1000);
  
  // 阻止浏览器的休眠/节能模式
  preventSleep();
  
  console.log('已增强禁用可见性检测');
}

// 增强主函数
function main() {
  enableAutoplay();
  removeVisibilityChangeListeners();
  
  // 定期检查新添加的视频
  setInterval(enableAutoplay, 3000);
  
  // 监听页面切换后，强制检查并播放视频
  window.addEventListener('focus', () => {
    console.log('页面获得焦点，检查视频状态');
    setTimeout(() => {
      enableAutoplay();
    }, 500);
  });
  
  // 添加直接干预
  interceptPlayerAPI();
  
  console.log('北森生涯教育平台视频助手已启动（增强版）');
}

// 页面加载后执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}