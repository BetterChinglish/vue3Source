import { activeEffect } from "./effect";

export function track(target, key) {

  console.log(target, key, activeEffect)

}