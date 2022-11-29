const time: {[k: string]: number} = {};

export const debugTime = {
  start: (name: string) => {
    time[name] = Date.now();
  },
  end: (name: string) => {
    console.log(`--- ${name} --->`, (Date.now() - time[name]) / 1000, 'sec');
  },
};
