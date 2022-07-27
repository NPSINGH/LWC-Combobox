// Common method JS to share the common code in the other LWC components
    function deepClone(obj, hash = new WeakMap()) {
        if (Object(obj) !== obj) return obj; // primitives
        if (hash.has(obj)) return hash.get(obj); // cyclic reference
        const result = obj instanceof Set ? new Set(obj) // See note about this!
                     : obj instanceof Map ? new Map(Array.from(obj, ([key, val]) => 
                                            [key, deepClone(val, hash)])) 
                     : obj instanceof Date ? new Date(obj)
                     : obj instanceof RegExp ? new RegExp(obj.source, obj.flags)
                     // ... add here any specific treatment for other classes ...
                     // and finally a catch-all:
                     : obj.constructor ? new obj.constructor() 
                     : Object.create(null);
        hash.set(obj, result);
        return Object.assign(result, ...Object.keys(obj).map(
            key => ({ [key]: deepClone(obj[key], hash) }) ));
    }
    
    const uniqueStrGenerator = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

// export the variables and functions which you wanted to share with other LWC components
   export {deepClone,uniqueStrGenerator};