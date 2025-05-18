package lambda.start;

public class Ex0RefMain {

    public static void hello(String keyword){
        System.out.println("프로그램 시작");
        System.out.println(keyword);
        System.out.println("프로그램 종료");
    }

    public static void main(String[] args) {
        hello("Hello Java");
        hello("Helllo Spring");
    }
}
