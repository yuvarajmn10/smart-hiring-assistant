class MaxHeap {
    constructor() {
        this.heap = [];
        // Internal array — heap is stored as an array, not a tree
        // For index i:
        // parent → Math.floor((i - 1) / 2)
        // left → 2 * i + 1
        // right → 2 * i + 2
    }
    size() {
        return this.heap.length;
    }
    isEmpty() {
        return this.heap.length === 0;
    }
    // Insert a candidate into the heap
    insert(candidate) {
        this.heap.push(candidate);
        // Add at end, then bubble up to correct position
        this._bubbleUp(this.heap.length - 1);
    }
    // Remove and return the highest scoring candidate
    extractMax() {
        if (this.isEmpty()) return null;
        if (this.heap.length === 1) return this.heap.pop();
        const max = this.heap[0];
        // Move last element to top, then sink it down
        this.heap[0] = this.heap.pop();
        this._sinkDown(0);
        return max;
    }
    // Bubble up — fix heap after insert
    _bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            const score = this.heap[index].aiScore ?? -1;
            const parentScore = this.heap[parentIndex].aiScore ?? -1;
            // ?? -1 handles null scores — they sink to the bottom
            if (score <= parentScore) break;
            // Already in correct position — stop
            // Swap with parent
            [this.heap[index], this.heap[parentIndex]] =
                [this.heap[parentIndex], this.heap[index]];
            index = parentIndex;
        }
    }
    // Sink down — fix heap after extractMax
    _sinkDown(index) {
        const length = this.heap.length;
        while (true) {
            const left = 2 * index + 1;
            const right = 2 * index + 2;
            let largest = index;
            // Find the largest among current, left child, right child
            if (left < length &&
                (this.heap[left].aiScore ?? -1) > (this.heap[largest].aiScore ?? -1)) {
                largest = left;
            }
            if (right < length &&
                (this.heap[right].aiScore ?? -1) > (this.heap[largest].aiScore ?? -1)) {
                largest = right;
            }
            if (largest === index) break;
            // Already in correct position — stop
            [this.heap[index], this.heap[largest]] =
                [this.heap[largest], this.heap[index]];
            index = largest;
        }
    }
}
// ── Helper function ─────────────────────────────────────
// Takes an array of candidates, returns top K sorted by aiScore
const getTopKCandidates = (candidates, k) => {
    const heap = new MaxHeap();
    // Insert all candidates into the heap
    candidates.forEach(c => heap.insert(c));
    // Extract top K one by one
    const result = [];
    const limit = Math.min(k, heap.size());
    for (let i = 0; i < limit; i++) {
        result.push(heap.extractMax());
    }
    return result;
    // Returns candidates sorted highest score first
};
module.exports = { MaxHeap, getTopKCandidates };