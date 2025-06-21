package intro;

import java.util.Arrays;
import java.util.stream.IntStream;

public class P120813 {
    public static void main(String[] args) {
        int n = 15;
        System.out.println("result = "+ Arrays.toString(solution(n)));
    }
    static int[] solution(int n) {
        return IntStream.rangeClosed(0, n).filter(i -> i % 2 == 1).toArray();
    }
}
