"use strict";
Object.prototype.deepClone = function () {
    const objectsCache = new WeakMap();
    function deepClone(obj) {
        if (objectsCache.has(obj)) {
            return objectsCache.get(obj);
        }
        const clone = Object.create(Object.getPrototypeOf(obj));
        objectsCache.set(obj, clone);
        const ownProperties = Object.getOwnPropertyNames(obj);
        ownProperties.forEach(prop => {
            const desc = Object.getOwnPropertyDescriptor(obj, prop);
            if (desc && 'value' in desc) {
                if (typeof desc.value === 'object') {
                    desc.value = deepClone(desc.value);
                } //
            }
            Object.defineProperty(clone, prop, desc);
        });
        return clone;
    }
    return deepClone(this);
};
