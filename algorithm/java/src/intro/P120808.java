package intro;

public class P120808 {
    public static void main(String[] args) {
        int[] result = solution(1, 2,3,4);

        System.out.println(result[0] + "..." +  result[1]);
    }
    public static int[] solution(int numer1, int denom1, int numer2, int denom2) {
        int[] answer = new int[2];

        // 1. 분모1과 분모2가 같을 경우 - 분자만 더해서 리턴
        if(denom1 == denom2){
            answer[0] = numer1 + numer2;
            answer[1] = denom1;
            return getInts(answer);
        }

        // 2. 분모 1과 분모2가 나눠 떨어질 경우
        boolean maxNum = Math.max(denom1, denom2) == denom1;
            // 2-1. 두 수 중 max 를 비교해서 분모 1이 max일 경우
        if(maxNum){
            if(denom1 % denom2 ==0){
                answer = getInts(numer1, denom1, numer2, denom2, answer);
                return getInts(answer);
            }
        }else {
            if(denom2 % denom1 ==0){
                answer = getInts(numer2, denom2,numer1, denom1, answer);
                return getInts(answer);
            }
        }
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

    private static int[] getInts(int numer1, int maxDenom, int numer2, int minDenom, int[] answer) {
        answer[0] = numer1 + (numer2 * (maxDenom/minDenom));
        answer[1] = maxDenom;
        return answer;
    }
    public static int gdc(int a, int b){
        return a % b == 0 ? b : gdc(b, a % b);
    }
}
