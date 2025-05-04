package dfs_bfs;

import java.util.*;

/**
 * 프로그래머스 - 네트워크
 * https://school.programmers.co.kr/learn/courses/30/lessons/43162
 */
public class P43162 {
    public static void main(String[] args) {
       int n = 3;
       int[][] computers = {{1, 1, 0}, {1, 1, 0}, {0, 0, 1}};

        int result = solution(n, computers);
        System.out.println("result = " + result);
    }
    public static int solution(int n, int[][] computers) {
        // 1.  int[] isNetwork = 컴퓨터 대수만큼 배열 생성 후 첫번째 배열을 제외한 모두 1로 초기화. 1: 네트워크 X | 0: 네트워크 O
        // -> 전체 배열 값 합칠때는 배열이 제일 빠름
        // 2. HashSet[] connectionArr = 같은 네트워크끼리 HashSet 배열로 묶음
        // -> 포함 여부를 찾을 때는 HashSet이 빠름
        // 3. computers 이중 for문으로 순회
        // 3-1. i == j -> pass
        // 3-2. computers[i][j] == 1 -> connectionArr에 해당 값이 있는지 확인
        // 3-3. 있다면 있는 배열에 넣기
        // 3-4. 없다면 새로 배열 만들어서 넣기
        // 3-5. isNetwork[i] = 0, isNetwork[j] = 0 처리
        // 4. return isNetwork의 합 + connetionArr의 길이 
        
        int[] isNetwork = new int[n];
        Arrays.fill(isNetwork, 1);
        isNetwork[0] = 0;

        List<HashSet<Integer>> connectionArr = new ArrayList<>();
        HashSet<Integer> visited = new HashSet<>();
        visited.add(3);
        connectionArr.add(visited);

       HashSet<Integer> visited2 = new HashSet<>();
        visited2.add(5);
        connectionArr.add(visited2);
        System.out.println("connectionArr.toString() = " + connectionArr.toString());
        for (int i = 0; i < computers.length; i++) {
            for (int j = i+1; j < computers[i].length; j++) {
                if(i==j) continue;
                if(computers[i][j] == 1){
                    for (int k = 0; k < connectionArr.size(); k++) {
                         Set<Integer> set = connectionArr.get(k);
                        boolean contains = (set.contains(i) || set.contains(j));
                        System.out.println("i = " + i + ", j = " + j + ", contains = " + contains);
                        if (!contains) continue;
                        break;
                    }
                    System.out.println("어디서1");
                }
                System.out.println("어디서2");

            }
            System.out.println("어디서3");
        }

        int answer = 0;
        return answer;
    }
}
