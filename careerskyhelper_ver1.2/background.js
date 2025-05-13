// 当用户点击扩展图标时触发
chrome.action.onClicked.addListener((tab) => {
    // 在当前标签页执行脚本
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: enableVideoAutoplay
    });
  });
  
  // 这个函数将被注入到页面中执行
  function enableVideoAutoplay() {
    alert('视频自动播放和禁用可见性检测已启用!');
    
    // 这里的代码主要是通知用户功能已启用
    // 实际功能由content.js自动实现
  }