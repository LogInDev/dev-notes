'''xml
<dependency>
    <groupId>net.javacrumbs.shedlock</groupId>
    <artifactId>shedlock-spring</artifactId>
    <version>5.16.0</version>
</dependency>

<dependency>
    <groupId>net.javacrumbs.shedlock</groupId>
    <artifactId>shedlock-provider-jdbc-template</artifactId>
    <version>5.16.0</version>
</dependency>
'''

'''sql
CREATE TABLE shedlock (
    name VARCHAR2(64) NOT NULL,
    lock_until TIMESTAMP(3) NOT NULL,
    locked_at TIMESTAMP(3) NOT NULL,
    locked_by VARCHAR2(255) NOT NULL,
    PRIMARY KEY (name)
);
'''

'''java
@Configuration
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "10m")
public class SchedulerConfig {

    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(
            JdbcTemplateLockProvider.Configuration.builder()
                .withJdbcTemplate(new JdbcTemplate(dataSource))
                .usingDbTime()
                .build()
        );
    }
}
'''

'''java
@Scheduled(cron = "0 * * * * *")
@SchedulerLock(
    name = "expireSystemAccountJob",
    lockAtMostFor = "10m",
    lockAtLeastFor = "30s"
)
public void expireSystemAccountJob() {
    // 실행 로직
}
'''


작업 도중 Pod가 죽어도 최대 10분 후 lock 자동 해제.
작업이 너무 빨리 끝나도 최소 30초는 lock 유지.
