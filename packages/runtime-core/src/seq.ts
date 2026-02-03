// 获取最长递增子序列
export default function getSequence(arr) {
  // 最长递增子序列结果，记录的是下标
  const result = [0];
  // 回溯数组
  const p = arr.slice();
  const len = arr.length;
  // 用于二分查找
  let start, end, mid;
  
  for(let i = 0; i < len; i++) {
    const arrI = arr[i];
    // 如果是0，则说明元素为新增元素，无需参与diff
    if(arrI === 0) continue;
    
    const lastIndex = result[result.length - 1];
    
    // 如果比最后一个元素大，则直接往后放
    if(arr[lastIndex] < arrI) {
      p[i] = lastIndex;
      result.push(i);
      continue;
    }
    
    // 否则需要找到最后一个比arrI小的元素位置，然后更新该位置的值为arrI
    // 这里使用二分查找法提高效率
    start = 0;
    end = result.length - 1;
    // 二分
    while(start < end) {
      mid = Math.floor((start + end) / 2);
      // arr中不会有重复的也就是说不可能相等，要么大于要么小于
      if(arr[result[mid]] < arrI) {
        start = mid + 1;
      } else {
        end = mid;
      }
    }
    // 找到插入位置
    if(arrI < arr[result[start]]) {
      // 记录上一个元素用于回溯
      if(start > 0) {
        p[i] = result[start - 1];
      }
      // 贪心替换
      result[start] = i;
    }
  }
  
  // 回溯结果，从后往前依次拿取
  let u = result.length;
  let v = result[u - 1];
  while(u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  
  // 返回最终结果
  return result
}
