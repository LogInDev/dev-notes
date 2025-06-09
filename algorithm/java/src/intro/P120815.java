package intro;

public class P120815 {
    public static void main(String[] args) {
        int n = 10;
        System.out.println("result = " + solution(n));
    }

    static int solution(int n) {
        int gcdNum = gcd(6, n);
        if(n>6) gcdNum = gcd(n, 6);
        return n*6/gcdNum/6;
    }
    static int gcd(int a, int b) {
        return a%b ==0?b:gcd(b, a%b);
    }
}
