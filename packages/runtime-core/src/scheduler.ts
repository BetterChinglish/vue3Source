

// 执行队列
const queue = [];

// 是否正在执行
let isFlushing = false;

const resolvedPromise = Promise.resolve();

export function queueJob(job) {
  if(!queue.includes(job)) {
    queue.push(job);
  }
  
  if(!isFlushing) {
    isFlushing = true;
    resolvedPromise.then(() => {
      isFlushing = false;
      
      const runQueue = queue.slice();
      queue.length = 0;
      
      for(let i = 0; i < runQueue.length; i++) {
        const job = runQueue[i];
        try {
          job();
        } catch (err) {
          console.error(err);
        }
      }
      runQueue.length = 0
      
    })
  }
}