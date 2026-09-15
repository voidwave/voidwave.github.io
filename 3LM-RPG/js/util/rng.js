// مولّد أرقام عشوائية ببذرة ثابتة — seeded PRNG so every run is reproducible.
export function createRng(seed = Date.now()) {
    let a = seed >>> 0;
    const next = () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    return {
        next,
        float: (min, max) => min + next() * (max - min),
        /** عدد صحيح ضمن [min, max] شامل الطرفين — inclusive integer */
        int: (min, max) => Math.floor(min + next() * (max - min + 1)),
        chance: (p) => next() < p,
        pick: (arr) => arr[Math.floor(next() * arr.length)],
        shuffle(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(next() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        },
        /** اختيار موزون من أزواج [[عنصر, وزن], …] — weighted pick */
        weighted(pairs) {
            let total = 0;
            for (const [, w] of pairs) total += w;
            let r = next() * total;
            for (const [item, w] of pairs) {
                r -= w;
                if (r <= 0) return item;
            }
            return pairs[pairs.length - 1][0];
        },
    };
}
