import { useState, useMemo } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Button } from '../components/ui/Button';
import { CodeExcerpt } from '../components/ui/CodeExcerpt';
import { ComplexityCard } from '../components/ui/ComplexityCard';

export function HeapLab() {
  const [heap, setHeap] = useState<number[]>([5, 10, 3, 8, 15, 1, 7]);

  const handleInsertRandom = () => {
    const newVal = Math.floor(Math.random() * 100) + 1;
    const newHeap = [...heap, newVal];
    // Sift up
    let i = newHeap.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (newHeap[i] < newHeap[parent]) {
        [newHeap[i], newHeap[parent]] = [newHeap[parent], newHeap[i]];
        i = parent;
      } else break;
    }
    setHeap(newHeap);
  };

  const handleExtractMin = () => {
    if (heap.length === 0) return;
    const newHeap = [...heap];
    newHeap[0] = newHeap[newHeap.length - 1];
    newHeap.pop();

    // Sift down
    let i = 0;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < newHeap.length && newHeap[left] < newHeap[smallest])
        smallest = left;
      if (right < newHeap.length && newHeap[right] < newHeap[smallest])
        smallest = right;
      if (smallest === i) break;
      [newHeap[i], newHeap[smallest]] = [newHeap[smallest], newHeap[i]];
      i = smallest;
    }
    setHeap(newHeap);
  };

  const handleReset = () => {
    setHeap([5, 10, 3, 8, 15, 1, 7]);
  };

  const heapDepth = useMemo(() => {
    return Math.ceil(Math.log2(heap.length + 1));
  }, [heap.length]);

  const treeData = useMemo(() => {
    const levels = Array.from({ length: heapDepth }, () => [] as number[]);
    for (let i = 0; i < heap.length; i++) {
      const level = Math.floor(Math.log2(i + 1));
      levels[level].push({ value: heap[i], index: i });
    }
    return levels;
  }, [heap, heapDepth]);

  return (
    <PageWrapper
      eyebrow="Unit III · Priority Queue"
      title="Binary Min-Heap"
      byline="Efficiently maintain the next-highest-priority incident for processing. Used internally by Dijkstra, A*, and MCMF."
    >
      <div className="space-y-8">
        {/* Problem Section */}
        <div className="rise-1 space-y-4">
          <h2 className="display text-2xl text-ink">The Problem</h2>
          <p className="text-sm text-ink/70 max-w-2xl">
            A priority queue maintains a dynamic set of elements, each with a priority (key). You need to efficiently insert, extract the minimum, and update keys. A binary min-heap is a complete binary tree where each parent ≤ its children.
          </p>
          <p className="text-sm text-ink/70 max-w-2xl">
            In emergency routing, the pending incident queue is a max-heap on severity. Dijkstra uses a min-heap on distance estimates. MCMF uses heaps on residual costs.
          </p>
        </div>

        {/* Interactive Heap Visualization */}
        <div className="rise-2">
          <h3 className="display text-lg text-ink mb-4">Interactive Heap</h3>

          {/* Array Representation */}
          <div className="mb-6 border border-brass/40 bg-brass/5 rounded p-4">
            <div className="text-sm font-medium text-ink mb-3">Array Representation</div>
            <div className="flex flex-wrap gap-2">
              {heap.map((val, i) => (
                <div
                  key={i}
                  className="w-12 h-12 flex items-center justify-center rounded-sm bg-paper border-2 border-brass font-mono font-semibold text-ink"
                >
                  {val}
                </div>
              ))}
            </div>
            <div className="text-xs text-ink/60 mt-2">
              Length: {heap.length} · Depth: {heapDepth}
            </div>
          </div>

          {/* Tree Visualization */}
          <div className="mb-6 border border-brass/40 bg-brass/5 rounded p-6">
            <div className="text-sm font-medium text-ink mb-4">Tree Representation</div>
            {heap.length === 0 ? (
              <div className="text-center text-ink/60 text-sm py-6">Empty heap</div>
            ) : (
              <div className="space-y-6">
                {treeData.map((level, levelIdx) => (
                  <div key={levelIdx}>
                    <div className="flex justify-center gap-4 flex-wrap">
                      {level.map(({ value, index }) => {
                        const parent = Math.floor((index - 1) / 2);
                        const isParentSmaller =
                          index > 0 && heap[parent] < value;
                        return (
                          <div
                            key={index}
                            className={`w-12 h-12 flex items-center justify-center rounded-full font-mono font-semibold text-sm transition-colors ${
                              isParentSmaller
                                ? 'bg-ruby/20 text-ruby border-2 border-ruby'
                                : 'bg-moss/20 text-moss border-2 border-moss'
                            }`}
                            title={`Index ${index}, Parent: ${parent}`}
                          >
                            {value}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs text-ink/60 mt-4">
              {heap.length > 0
                ? 'Heap property: each parent ≤ children'
                : 'Empty'}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 justify-center mb-6">
            <Button variant="primary" size="md" onClick={handleInsertRandom}>
              Insert Random
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleExtractMin}
              disabled={heap.length === 0}
            >
              Extract Min
            </Button>
            <Button variant="ghost" size="md" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>

        {/* Algorithm Explanation */}
        <div className="rise-3 space-y-4">
          <h3 className="display text-lg text-ink">How It Works</h3>

          <div className="space-y-6">
            <div className="border-l-4 border-brass p-4">
              <h4 className="font-medium text-ink mb-2">Insert (Sift Up)</h4>
              <ol className="text-sm text-ink/70 space-y-2 list-inside list-decimal">
                <li>Append element to the end of the array.</li>
                <li>
                  While element &lt; parent, swap with parent and move up.
                </li>
                <li>Stop when element ≥ parent or at root.</li>
              </ol>
              <div className="text-xs text-ink/60 mt-3 font-mono">
                Cost: O(log n) in worst case (move to root)
              </div>
            </div>

            <div className="border-l-4 border-moss p-4">
              <h4 className="font-medium text-ink mb-2">Extract-Min (Sift Down)</h4>
              <ol className="text-sm text-ink/70 space-y-2 list-inside list-decimal">
                <li>Return element at root (min value).</li>
                <li>
                  Move last element to root, remove from array.
                </li>
                <li>
                  While element &gt; smaller child, swap with smaller child and
                  move down.
                </li>
                <li>Stop when element ≤ both children or at leaf.</li>
              </ol>
              <div className="text-xs text-ink/60 mt-3 font-mono">
                Cost: O(log n) in worst case (move to leaf)
              </div>
            </div>

            <div className="border-l-4 border-ruby p-4">
              <h4 className="font-medium text-ink mb-2">Heapify (Build Heap)</h4>
              <ol className="text-sm text-ink/70 space-y-2 list-inside list-decimal">
                <li>
                  Given an unsorted array, convert to a valid heap.
                </li>
                <li>
                  Iterate from last non-leaf (index n/2 - 1) down to root, sift-down each.
                </li>
                <li>
                  This builds the heap in-place in O(n) time (amortized).
                </li>
              </ol>
              <div className="text-xs text-ink/60 mt-3 font-mono">
                Cost: O(n) total (not n log n!)
              </div>
            </div>
          </div>
        </div>

        {/* Complexity */}
        <div className="rise-4">
          <ComplexityCard
            best="O(1)"
            average="O(log n)"
            worst="O(log n)"
            space="O(n)"
          />
          <ul className="text-xs text-ink/70 space-y-1 mt-3">
            <li>
              <strong>Insert:</strong> O(log n) sift-up
            </li>
            <li>
              <strong>Extract-min:</strong> O(log n) sift-down
            </li>
            <li>
              <strong>Heapify:</strong> O(n) if building from scratch
            </li>
            <li>
              <strong>Peek (find min):</strong> O(1) — it's always at root
            </li>
          </ul>
        </div>

        {/* Code */}
        <CodeExcerpt
          filename="Binary Heap — C++ Pseudocode"
          code={`template <typename T>
class MinHeap {
    vector<T> heap;

public:
    void insert(T val) {
        heap.push_back(val);
        int i = heap.size() - 1;
        while (i > 0) {
            int parent = (i - 1) / 2;
            if (heap[i] < heap[parent]) {
                swap(heap[i], heap[parent]);
                i = parent;
            } else break;
        }
    }

    T extract_min() {
        T min_val = heap[0];
        heap[0] = heap.back();
        heap.pop_back();

        int i = 0;
        while (true) {
            int smallest = i;
            int left = 2 * i + 1, right = 2 * i + 2;
            if (left < heap.size() && heap[left] < heap[smallest])
                smallest = left;
            if (right < heap.size() && heap[right] < heap[smallest])
                smallest = right;
            if (smallest == i) break;
            swap(heap[i], heap[smallest]);
            i = smallest;
        }
        return min_val;
    }

    T peek() const { return heap[0]; }
    bool empty() const { return heap.empty(); }
    int size() const { return heap.size(); }
};`}
        />

        {/* Domain Rationale */}
        <div className="rise-5 border-l-4 border-ruby p-6 bg-ruby/5 rounded">
          <h4 className="font-medium text-ink mb-3">Domain Rationale</h4>
          <p className="text-sm text-ink/70 mb-3">
            The C++ standard library uses <code className="font-mono">std::priority_queue</code>, which is a heap under the hood. Dijkstra, A*, and MCMF all rely on heaps for efficient extract-min operations. Without heaps (linear scan each time), Dijkstra would be O(V²) instead of O((V+E) log V).
          </p>
          <p className="text-sm text-ink/70">
            In our emergency system, the pending incident queue is a max-heap on severity. High-severity incidents bubble to the top for faster processing. The heap ensures no incident is forgotten (unlike a simple list that might miss lower-priority ones under load).
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
