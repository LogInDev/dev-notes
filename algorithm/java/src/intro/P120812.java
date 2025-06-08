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
        for (int num : array) {
            map.put(num, map.getOrDefault(num, 0) + 1);
        }

        int maxFreq = Collections.max(map.values());

        List<Integer> mode = new ArrayList<>();
        for (Map.Entry<Integer, Integer> entry : map.entrySet()) {
            if (entry.getValue() == maxFreq) {
                mode.add(entry.getKey());
            }
        }

        return mode.size()>1 ?-1:mode.get(0);
    }
}
