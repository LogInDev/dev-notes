package intro;

import java.util.Arrays;

public class P120813 {
    public static void main(String[] args) {
        int n = 10;
        System.out.println("result = "+ Arrays.toString(solution(n)));
    }
    static int[] solution(int n) {
        int index = n/2;

        if(n % 2 != 0){
            return resultArray(n, index);
        }
        return resultArray(n-1, index-1);
    }
    static int[] resultArray(int n, int index){
        int[] arr = new int[index+1];
        while(n >0){
            arr[index] = n;
            n-=2;
            index-=1;
        }
        return arr;
    }
}
