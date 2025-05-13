// 锁定页面可见性状态
Object.defineProperty(document, 'visibilityState', {
    get: () => 'visible',
    configurable: false
});
Object.defineProperty(document, 'hidden', {
    get: () => false,
    configurable: false
});

// 拦截所有visibility相关事件
const events = [
    'visibilitychange',
    'msvisibilitychange',
    'webkitvisibilitychange'
];

const originalAdd = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (events.includes(type)) {
        console.log(`Blocked ${type} listener:`, listener.toString());
        return; // 直接丢弃监听器
    }
    originalAdd.call(this, type, listener, options);
};