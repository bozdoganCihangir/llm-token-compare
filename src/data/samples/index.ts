const python = `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

# Example usage
numbers = [3, 6, 8, 10, 1, 2, 1]
print(quicksort(numbers))
`;

const korean = `인공지능은 인간의 학습능력과 추론능력을 컴퓨터 프로그램으로 실현한 기술이다. 최근 대규모 언어 모델의 발전으로 자연어 처리, 이미지 생성, 코드 작성 등 다양한 분야에서 인공지능이 활용되고 있다. 그러나 같은 텍스트라도 모델마다 토큰화 방식이 다르기 때문에 비용과 컨텍스트 사용량이 크게 달라질 수 있다.
`;

const json = `{
  "user": {
    "id": "u_8f3a2c91",
    "email": "alice@example.com",
    "name": "Alice Johnson",
    "preferences": {
      "theme": "dark",
      "language": "en-US",
      "notifications": { "email": true, "push": false, "sms": false }
    },
    "subscriptions": [
      { "plan": "pro", "since": "2024-03-15", "renews": "2026-03-15" },
      { "plan": "addon-storage", "since": "2025-01-10", "renews": "2026-01-10" }
    ]
  }
}
`;

const prose = `Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure.
`;

export const samples = {
  python,
  korean,
  json,
  prose,
} as const;

export type SampleName = keyof typeof samples;
