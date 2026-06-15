# Thuật toán phỏng vấn (~< Medium LeetCode)

## Tóm tắt một câu

Phỏng vấn backend thường hỏi **Medium trở xuống** — array/string, hash map, two pointers, BFS/DFS, binary search, sliding window. Trọng tâm: **nói được approach + complexity**, code sạch, edge case — không cần memorise 500 bài.

---

## Pattern cần nắm

| Pattern | Bài điển hình | Complexity mục tiêu |
|---------|---------------|---------------------|
| **Hash map** | Two Sum, group anagrams | O(n) time |
| **Two pointers** | Valid palindrome, container water | O(n) |
| **Sliding window** | Longest substring without repeat | O(n) |
| **Binary search** | Search rotated array | O(log n) |
| **BFS/DFS** | Islands, shortest path grid | O(V+E) |
| **Stack** | Valid parentheses | O(n) |
| **Heap** | Top K frequent | O(n log k) |
| **Prefix sum** | Subarray sum equals K | O(n) |

---

## Quy trình làm bài (phỏng vấn)

1. **Clarify** — input size, duplicate, negative, empty?
2. **Example** — walk through 1–2 case tay.
3. **Brute force** — nói O(n²) trước nếu cần.
4. **Optimize** — map, sort, two pointers.
5. **Code** — tên biến rõ, handle edge.
6. **Test** — empty, single element, max size.
7. **Complexity** — time + space.

---

## Go template hay dùng

```go
// Hash map frequency
freq := make(map[int]int)
for _, x := range nums {
    freq[x]++
}

// BFS queue
q := []int{start}
for len(q) > 0 {
    cur := q[0]
    q = q[1:]
    // ...
}
```

---

## Bài gợi ý luyện (Medium↓)

| Đề | Pattern |
|----|---------|
| Two Sum | Hash map |
| Valid Parentheses | Stack |
| Merge Intervals | Sort |
| LRU Cache | Hash + doubly linked list |
| Number of Islands | DFS/BFS |
| Course Schedule | Topological sort |
| Binary Search | Classic |
| Longest Substring Without Repeating | Sliding window |

---

## Câu trả lời ngắn (phỏng vấn)

Nắm map, two pointers, sliding window, BFS/DFS, binary search. Luôn nêu complexity và edge case. Backend có thể hỏi thêm **concurrency** (worker pool) thay pure algo — liên hệ thực tế.
