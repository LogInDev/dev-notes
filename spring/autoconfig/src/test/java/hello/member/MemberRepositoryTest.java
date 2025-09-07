package hello.member;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class MemberRepositoryTest {

    @Autowired
    MemberRepository memberRepository;

    @Transactional
    @DisplayName("db연결 테스트")
    @Test
    void memberTest(){
        // given
        final Member member = new Member("idA", "memeberA");
        memberRepository.initTable();
        memberRepository.save(member);

        // when
        final Member findMember = memberRepository.find(member.getMemberId());

        // then
        assertThat(findMember.getMemberId()).isEqualTo(member.getMemberId());
        assertThat(findMember.getName()).isEqualTo(member.getName());

    }
}
