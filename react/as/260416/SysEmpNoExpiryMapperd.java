package com.skhynix.hcp.arch.gateway.cronjob.mapper;

import com.skhynix.hcp.arch.gateway.cronjob.dto.HcpApiExpiredSysEmpNo;
import com.skhynix.hcp.arch.gateway.cronjob.dto.HcpApiInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SysEmpNoExpiryMapper {

    List<String> getExpiredSysEmpNoByAccountStatus();

    List<HcpApiExpiredSysEmpNo> getUpdatedExpirySysEmpNos();

    List<HcpApiInfo> getPermissionReqBySysEmpNo(@Param("sysEmpNo") String sysEmpNo);

    int updateReqToRejBySysEmpNo(@Param("reqList") List<HcpApiInfo> reqList);

    List<HcpApiInfo> getSubscribeIdBySysEmpNo(@Param("sysEmpNo") String sysEmpNo);

    List<HcpApiInfo> getApiInfoByIdList(@Param("ids") List<HcpApiInfo> ids);

    int updateApiSub(HcpApiInfo apiInfo);

    int deleteUnexpired();

    int insertBatchHistIfNotExists(@Param("sysEmpNos") List<String> sysEmpNos);

    int updateBatchStatusBySysEmpNo(HcpApiExpiredSysEmpNo dto);
}
