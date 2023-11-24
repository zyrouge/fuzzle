export default (fn: (...args: any[]) => any | Promise<any>) => {
    if (process.argv.includes("--no-run")) return fn;
    return fn();
};
