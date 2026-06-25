CASE
    /* 권한 필요 없는 서비스 */
    WHEN AUTH_YN = 'PUB' THEN
        CASE SUB_STAT_CD
            WHEN 'APR' THEN 'SUB_APR'
            WHEN 'NOR' THEN 'SUB_NOR'
            ELSE 'SUB_NON'
        END

    /* 권한 필요한 서비스 */
    ELSE
        CASE
            WHEN AUTH_YN = 'NON' THEN 'AUTH_NON'
            WHEN AUTH_YN = 'APR' THEN 'AUTH_APR'
            WHEN AUTH_YN = 'NOR' AND SUB_STAT_CD = 'APR' THEN 'SUB_APR'
            WHEN AUTH_YN = 'NOR' AND SUB_STAT_CD = 'NOR' THEN 'SUB_NOR'
            WHEN AUTH_YN = 'NOR' THEN 'SUB_NON'
        END
END AS STATUS_CD