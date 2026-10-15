package lemonadex.lemoguide.lemoguide_mvp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

import lemonadex.lemoguide.lemoguide_mvp.common.config.EnvFileLoader;

@SpringBootApplication
@ConfigurationPropertiesScan
public class LemoguideMvpApplication {

	public static void main(String[] args) {
		// Load backend/.env (local DB credentials) before Spring reads its config.
		EnvFileLoader.load();
		SpringApplication.run(LemoguideMvpApplication.class, args);
	}

}
