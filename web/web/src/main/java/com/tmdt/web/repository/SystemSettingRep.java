package com.tmdt.web.repository;

import com.tmdt.web.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingRep extends JpaRepository<SystemSetting, String> {
}
