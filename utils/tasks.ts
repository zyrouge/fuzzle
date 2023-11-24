export const handleTask = async <T>(name: string, task: () => Promise<T>) => {
    try {
        const result = await task();
        console.log(`Excution of '${name}' was successful!`);
        return result;
    } catch (error) {
        console.error(`Excution of '${name}' was failed! Reason: ${error}.`);
    }
};
