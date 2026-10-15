package lemonadex.lemoguide.lemoguide_mvp.network;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/network")
@RequiredArgsConstructor
public class NetworkAdminController {
    private final NetworkModerationService moderation;
    private final NetworkChallengeService challenges;
    private final NetworkAdminService admin;
    @GetMapping("/overview") public ApiResponse<?> overview(){return ApiResponse.success(admin.overview());}
    @GetMapping("/members") public ApiResponse<?> members(@RequestParam(defaultValue="") String q,@RequestParam(defaultValue="all") String status,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size){return ApiResponse.success(admin.members(q,status,page,size));}
    @GetMapping("/members/{id}") public ApiResponse<?> member(@PathVariable long id){return ApiResponse.success(admin.member(id));}
    @PutMapping("/members/{id}/suspended") public ApiResponse<?> suspend(@PathVariable long id,@RequestBody NetworkDtos.State state){admin.suspend(id,state.enabled());return ApiResponse.success(null);}
    @GetMapping("/posts") public ApiResponse<?> posts(@RequestParam(defaultValue="") String q,@RequestParam(defaultValue="") String kind,@RequestParam(defaultValue="all") String status,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size){return ApiResponse.success(admin.posts(q,kind,status,page,size));}
    @GetMapping("/posts/{id}") public ApiResponse<?> post(@PathVariable long id){return ApiResponse.success(admin.post(id));}
    @PutMapping("/posts/{id}/hidden") public ApiResponse<?> hidePost(@PathVariable long id,@RequestBody NetworkDtos.State state){admin.hidePost(id,state.enabled());return ApiResponse.success(null);}
    @PutMapping("/comments/{id}/hidden") public ApiResponse<?> hideComment(@PathVariable long id,@RequestBody NetworkDtos.State state){admin.hideComment(id,state.enabled());return ApiResponse.success(null);}
    @GetMapping("/cohorts") public ApiResponse<?> cohorts(@RequestParam(defaultValue="") String q,@RequestParam(defaultValue="") String kind,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size){return ApiResponse.success(admin.cohorts(q,kind,page,size));}
    @DeleteMapping("/cohorts/{id}") public ApiResponse<?> deleteCohort(@PathVariable long id){admin.deleteCohort(id);return ApiResponse.success(null);}
    @GetMapping("/mentoring") public ApiResponse<?> mentoring(@RequestParam(defaultValue="") String q,@RequestParam(defaultValue="") String status,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size){return ApiResponse.success(admin.mentoring(q,status,page,size));}
    @GetMapping("/reports") public ApiResponse<?> list(){return ApiResponse.success(moderation.reports());}
    @GetMapping("/challenges") public ApiResponse<?> challenges(){return ApiResponse.success(challenges.adminList());}
    @PostMapping("/challenges") public ApiResponse<?> create(@Valid @RequestBody NetworkDtos.ChallengeInput request){return ApiResponse.success(challenges.create(request));}
    @PutMapping("/challenges/{id}") public ApiResponse<?> update(@PathVariable long id,@Valid @RequestBody NetworkDtos.ChallengeInput request){challenges.update(id,request);return ApiResponse.success(null);}
    @DeleteMapping("/challenges/{id}") public ApiResponse<?> delete(@PathVariable long id){challenges.delete(id);return ApiResponse.success(null);}
    @PutMapping("/reports/{id}") public ApiResponse<?> decide(@PathVariable long id,@Valid @RequestBody NetworkDtos.Decision request){moderation.decide(id,request.action());return ApiResponse.success(null);}
}
