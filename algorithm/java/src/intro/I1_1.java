package intro;

import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

public class I1_1 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String str = sc.nextLine();
        String findStr = sc.nextLine();
        int cnt = solution(str, findStr);
        System.out.println(cnt);
    }

    private static int solution(String str, String findStr) {
        int answer = 0;

        str = str.toLowerCase();
        // RESULT CASE 1
//        Map<Character, Integer> map = new HashMap<>();
//        for (int i = 0; i < str.length(); i++) {
//            map.put(str.charAt(i), map.getOrDefault(str.charAt(i), 0) + 1);
//        }
//        answer = map.getOrDefault(findStr.toLowerCase().charAt(0), 0);

        // RESULT CASE 2
//        for (char c : str.toCharArray()) {
//            if (c == findStr.toLowerCase().charAt(0)) {
//                answer++;
//            }
//        }

        // 강의 풀이
        str = str.toUpperCase();
        char t = Character.toUpperCase(findStr.charAt(0));
        for (int i = 0; i < str.length(); i++) {
             if(str.charAt(i) == t) answer++;

        }
        return answer;
    }
}
