export function at<T>(arr: ArrayLike<T>, index: number): T {
    const value = arr[index];
    if (value === undefined) {
        throw new RangeError(`Index ${index} out of bounds (length ${arr.length})`);
    }
    return value;
}
