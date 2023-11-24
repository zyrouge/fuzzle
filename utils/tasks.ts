export const handleTask = async <T>(name: string, task: () => Promise<T>) => {
    try {
        const result = await task();
        console.log(`Execution of '${name}' succeeded!`);
        return result;
    } catch (error) {
        console.error(`Execution of '${name}' failed! (${error})`);
    }
};
