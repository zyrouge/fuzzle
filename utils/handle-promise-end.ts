export default <T>(task: string, prom: Promise<T>) => {
    return prom
        .then(() => {
            console.log(`Excution of '${task}' was successful!`);
        })
        .catch((err) => {
            console.error(
                `Excution of '${task}' was failed! Reason: ${err?.message}.`
            );
        });
};
