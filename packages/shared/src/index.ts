export function isObject(value) {
    return typeof value === "object" && value !== null;
}

export function isFunction(value) {
    return typeof value === "function";
}

export function isString(value) {
    return typeof value === "string";
}

export function isArray(value) {
    return Array.isArray(value);
}

export function isType(value, type) {
    // 获取值的内部 [[Class]] 名称，例如 "[object Number]"
    const typeString = Object.prototype.toString.call(value);
    // 构造预期的类型字符串，如 "[object Number]"
    const expectedString = `[object ${type.name}]`;  // 当 type 是构造函数时
    // 或者如果 type 是字符串（如 "Number"），则用 type 直接替换
    // const expectedString = `[object ${type}]`;
    return typeString === expectedString;
}


export * from './shapeFlags'
