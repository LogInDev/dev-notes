package _string;

import java.util.Scanner;

public class I2_4 {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int cnt = input.nextInt();
        String[] words = new String[cnt];

        for (int i = 0; i < cnt; i++) {
             words[i] = input.next();
 /*
 방식 1) StringBuilder의 reverse()메소드로 뒤집기 구현
            StringBuilder sb = new StringBuilder(words[i]);
            sb.reverse();
            System.out.println(sb);
  */
 /*
 방식 2) 직접 뒤집기 알고리즘 구현
 */
            char[] word = words[i].toCharArray();
            int lt=0, rt=word.length-1;
            while (lt<rt){
                char tmp = word[lt];
                word[lt] = word[rt];
                word[rt] = tmp;
                lt++;
                rt--;
            }
            words[i] = String.valueOf(word);
            System.out.println(words[i]);
        }
    }
}
