package _string;

import java.util.Scanner;

public class I2_1 {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        String input1 = input.next();
        String input2 = input.next();
        char[] charArray = input1.toLowerCase().toCharArray();
        int answer = 0;
        for (char c : charArray) {
            if (c==input2.toLowerCase().charAt(0)){answer++;}
        }
        System.out.println(answer);
    }
}
