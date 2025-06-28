package intro;

import java.util.Arrays;

public class P120811 {
    public static void main(String[] args) {
        int[] arr = {1, 2, 7, 10, 11};
        int result = solution(arr);
        System.out.println("result = " + result);
    }

    private static int solution(int[] arr) {
        int answer = 0;
        Arrays.sort(arr);
        if(arr.length %2 ==0){
            answer = (arr[arr.length/2] + arr[arr.length/2-1]) / 2;
            return answer;
        }
        answer = arr[arr.length/2];
        return answer;
    }
}
