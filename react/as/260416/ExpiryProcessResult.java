package com.skhynix.hcp.arch.gateway.cronjob.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ExpiryProcessResult {
    private List<HcpApiInfo> permissionRejectedList = new ArrayList<>();
    private List<HcpApiInfo> rejectedList = new ArrayList<>();
    private List<HcpApiInfo> unsubscribedList = new ArrayList<>();
}
