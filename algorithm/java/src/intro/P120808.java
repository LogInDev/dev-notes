package intro;

public class P120808 {
    public static void main(String[] args) {
        int[] result = solution(1, 2,3,4);

        System.out.println(result[0] + "..." +  result[1]);
    }
    public static int[] solution(int numer1, int denom1, int numer2, int denom2) {
        int[] answer = new int[2];

        answer[0] = (numer1 * denom2) + (numer2 * denom1);
        answer[1] = denom1 * denom2;
        return getInts(answer);
    }

    public static int[] getInts(int[] answer) {
        int gdcNum = gdc(Math.max(answer[0], answer[1]), Math.min(answer[0], answer[1]));
        answer[0] = answer[0] / gdcNum;
        answer[1] = answer[1] / gdcNum;
        return answer;
    }
    public static int gdc(int a, int b){
        return a % b == 0 ? b : gdc(b, a % b);
    }
}
