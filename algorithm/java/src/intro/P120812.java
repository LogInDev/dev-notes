package intro;

import java.util.*;

public class P120812 {
    public static void main(String[] args) {
//        int[] arr = {1, 2, 3, 3, 3, 4};
        int[] arr = {1, 2,1, 2, 2};
        System.out.println("result = " + solution(arr));
    }
    static int solution(int[] array){
        Map<Integer, Integer> map = new HashMap<>();
        int answer = 0;
        int maxFreq = 0;

        for (int num : array) {
            map.put(num, map.getOrDefault(num, 0) + 1);

            if(maxFreq < map.get(num)){
                maxFreq = map.get(num);
                answer = num;
            }else if(maxFreq == map.get(num)){
                answer = -1;
            }
        }

        return answer;
    }
}
