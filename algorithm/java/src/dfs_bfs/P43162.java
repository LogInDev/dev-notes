package dfs_bfs;

/**
 * 프로그래머스 - 네트워크
 * https://school.programmers.co.kr/learn/courses/30/lessons/43162
 */
public class P43162 {
    public static void main(String[] args) {
        int n = 3;
        int[][] computers = {{1, 1, 0}, {1, 1, 0}, {0, 0, 1}};
        int result = solution(n, computers);
        System.out.println("result = " + result);  // 예상 출력: 2
    }
    public static int solution ( int n, int[][] computers){
        boolean[] visited = new boolean[n];
        int networkCount = 0;

        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                dfs(computers, visited, i);
                networkCount++;
            }
        }

        return networkCount;
    }

    private static void dfs ( int[][] computers, boolean[] visited, int current){
        visited[current] = true;

        for (int next = 0; next < computers.length; next++) {
            if (!visited[next] && computers[current][next] == 1) {
                dfs(computers, visited, next);
            }
        }
    }
}
