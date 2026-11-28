// 集中定义离线签名使用的公民链固定参数。

import 'dart:convert';
import 'dart:typed_data';

class ChainConstants {
  const ChainConstants._();

  /// SS58 地址前缀（CitizenChain 注册编号）。
  static const int ss58Prefix = 2027;

  /// 2026-08-07 冻结并已部署的唯一正式创世哈希；Runtime 升级不会改变该值。
  static const String genesisHash =
      '0x18847a5dfd263272f2e7727836fe6582f8c4463ff48609df7b96d5e4d9dd24dd';

  /// 当前已部署Runtime（spec 9）的唯一交易版本；后续升级生效后再同步。
  /// V5 交易格式号不等于 transaction_version。其他模块和测试仅引用此值。
  static const int transactionVersion = 8;

  /// 钱包交易版本有效性的唯一判断入口。
  static bool supportsTransactionVersion(int version) =>
      version == transactionVersion;
}

// 登记离线交易解码所需的链上pallet与call索引。

class PalletRegistry {
  const PalletRegistry._();

  // ---- Onchain (4) ----
  static const int onchainPallet = 4;
  static const int transferWithRemarkCall = 0;

  // ---- VotingEngine (9) · 引擎核心 ----
  // 仅承载 lifecycle extrinsic:finalize_proposal / retry_passed_proposal /
  // cancel_passed_proposal。mode-specific 投票 extrinsic 在 InternalVote(20) /
  // JointVote(21) sub-pallet。
  static const int votingEnginePallet = 9;

  /// `finalize_proposal(proposal_id)` — 任意人触发终态执行(无需签投票)。
  static const int finalizeProposalCall = 3;

  /// `retry_passed_proposal(proposal_id)` — 已通过提案的手动执行入口。
  static const int retryPassedProposalCall = 4;

  /// `cancel_passed_proposal(proposal_id, reason)` — 已通过但确认不可执行的提案取消入口。
  static const int cancelPassedProposalCall = 5;

  // ---- Identity (10) · 公民链上身份 ----
  static const int identityPallet = 10;

  /// `register_voting_identity(actor_cid_number, payload, citizen_signature)`。
  static const int registerVotingIdentityCall = 0;

  /// `upgrade_to_candidate_identity(actor_cid_number, payload, citizen_signature)`。
  static const int upgradeToCandidateIdentityCall = 1;

  /// `update_voting_identity(actor_cid_number, payload, citizen_signature)`。
  static const int updateVotingIdentityCall = 2;

  /// `update_candidate_identity(actor_cid_number, payload, citizen_signature)`。
  static const int updateCandidateIdentityCall = 3;

  /// `revoke_identity(actor_cid_number, cid_number)`。
  static const int revokeIdentityCall = 4;

  /// `self_occupy_cid(cid_number)`；绑定账户签完整交易，自付费并取得匿名身份。
  static const int selfOccupyCidCall = 5;

  /// `occupy_cid(actor_cid_number, actor_role_code, cid_number, account_id, expires_at, citizen_signature)`
  /// — 注册局代办「占即绑」；内层 citizen_signature 由用户选择的新账户签名，
  /// 外层 extrinsic 才由注册局管理员账户签名。
  static const int occupyCidCall = 6;

  /// `admin_rebind_cid_account_id(actor_cid_number, actor_role_code, cid_number, new_account_id,
  /// expected_binding_revision, expires_at, new_account_signature)`
  /// — 注册局按匿名/实名辖区规则为 CID 换绑钱包账户。链上 call 7 由已删的批量占号顶替。
  static const int adminRebindCidAccountIdCall = 7;

  /// `revoke_cid(actor_cid_number, cid_number)`
  /// — 注册局吊销 CID 号(墓碑,永不复用；外层 extrinsic 由注册局管理员签名)。
  static const int revokeCidCall = 8;

  /// 匿名公民号自助换绑；新账户签交易，原账户授权由Runtime独立验签。
  static const int selfRebindCidAccountIdCall = 9;

  // ---- InternalVote sub-pallet (20) · 内部投票管理员一人一票 ----
  static const int internalVotePallet = 20;

  /// `cast(proposal_id, approve)`。
  static const int internalVoteCall = 0;

  // ---- JointVote sub-pallet (21) · 联合投票(内部投票阶段 + 联合公投)----
  static const int jointVotePallet = 21;

  /// `cast_role_vote(proposal_id, cid_number, voter_role_code, approve)` — 联合投票岗位投票阶段。
  static const int jointVoteCall = 0;

  /// `cast_referendum(proposal_id, approve)` — 联合公投阶段,链上按账户读取公民身份。
  static const int castReferendumCall = 1;

  // call_index 2 永久留洞：联合提案创建时由引擎内联生成全国人口快照。

  // ---- ElectionVote sub-pallet (22) · 普选/互选投票 ----
  static const int electionVotePallet = 22;

  /// `cast_popular_vote(proposal_id, candidate_subject)`。
  static const int castPopularVoteCall = 2;

  /// `cast_mutual_vote(proposal_id, voter_role_code, candidate_subject)`。
  static const int castMutualVoteCall = 3;

  // ---- 业务 pallet:仅承载提案创建入口 ----
  //
  // 投票统一走 `InternalVote(20).cast(0)`,手动重试/取消统一走
  // `VotingEngine(9).retry_passed_proposal(4)` / `cancel_passed_proposal(5)`。

  // ---- Multisig (17) ----
  // call_index 3/4/5 留洞不复用。
  static const int multisigPallet = 17;
  static const int proposeTransferCall = 0;
  static const int proposeSafetyFundCall = 1;
  static const int proposeSweepCall = 2;

  // ---- 协议升级 Upgrade (12) ----
  static const int upgradePallet = 12;
  static const int proposeRuntimeUpgradeCall = 0;
  static const int developerDirectUpgradeCall = 2;

  // ---- PublicEntity (30) / PrivateEntity (31) ----
  // 公权机构与私权机构登记管理分别由两个 pallet 承载。
  static const int publicEntityPallet = 30;
  static const int privateEntityPallet = 31;
  static const int proposeCloseInstitutionCall = 1;
  // call_index 4 永久留洞：机构 pending 状态由投票引擎终态回调清理。

  // call_index 5 永久关闭：普通机构创建必须改由业务模块提交包含初始岗位、权限、
  // 任职和投票规则的原子结果，不保留旧直接创建载荷。
  static const int updateInstitutionInfoCall = 6;
  static const int addInstitutionAccountCall = 7;
  static const int proposeInstitutionGovernanceCall = 8;
  static const int registerInstitutionRolesCall = 9;

  /// 普通机构原生权限及共同阈值政策。
  static const int proposeInstitutionPolicyCall = 11;

  // ---- Personal (7) · 个人多签生命周期与成员治理 ----
  // 个人多签独立 pallet,MODULE_TAG = b"per-mgmt",
  // ACTION enum 独立命名空间(ACTION_CREATE=0/ACTION_CLOSE=1)。
  // propose_create(account_name, admins, regular_threshold, amount):
  // admins_len由名单长度派生，普通阈值允许1..N，创建仍须全员通过。
  static const int personalPallet = 7;
  static const int proposeCreatePersonalCall = 0;
  static const int proposeClosePersonalCall = 1;
  // call_index 2 永久留洞：个人多签 pending 状态由投票引擎终态回调清理。

  static const int proposePersonalAdminSetChangeCall = 3;
  // pallet 29 已关闭，不保留个人成员调用入口。

  // ---- Destroy (13) ----
  // call_index 1 留洞不复用。
  static const int destroyPallet = 13;
  static const int proposeDestroyCall = 0;

  static bool isPersonalAdminSetChangeCall(int palletIndex, int callIndex) {
    return palletIndex == personalPallet &&
        callIndex == proposePersonalAdminSetChangeCall;
  }

  // ---- GrandpaKey (15) ----
  static const int grandpaKeyPallet = 15;
  static const int proposeEmergencyGrandpaKeyRecoveryCall = 0;
  static const int scheduleGrandpaKeyRotationCall = 1;

  // ---- FullnodeIssue (6) · 有意不登记 ----
  // 链端 pallet_index=6 承载 bind_reward_account(0) / rebind_reward_account(1),
  // 由矿工(citizenchain 桌面全节点)用其 PoW 热钥自签绑定奖励账户,不经冷钱包扫码冷签。
  // 故此处刻意不登记该 pallet/call——冷钱包扫到它会按两色严格模式判为无法识别而红拒(拒签),
  // 属预期行为(冷钱包不签矿工绑定交易),不是遗漏。

  // ---- ResolutionIssue (8) ----
  static const int resolutionIssuePallet = 8;
  static const int proposeIssuanceCall = 0;

  // ---- OnchainIssue (23) · 链上发行代币(Plain FT) ----
  // call_index 5..=9 / 15+ 留洞不复用(永久 ABI)。
  // 业务调用走 propose_X(InternalVote),监管调用走 propose_monitor_X(JointVote)。
  // 十个调用都以 actor_cid_number 开头；仅 propose_issue 紧随
  // execution_account_id，机构身份不得从该账户反推。
  // 投票/重试/取消统一走 InternalVote(20)/JointVote(21)/VotingEngine(9.4/9.5)。
  static const int onchainIssuePallet = 23;
  // 业务 propose
  static const int proposeIssueCall = 0;
  static const int proposeMintCall = 1;
  static const int proposeBurnCall = 2;
  static const int proposeCloseAssetCall = 3;
  static const int proposeAssetTransferCall = 4;
  // 监管 propose(NRC,JointVote)
  static const int proposeMonitorFreezeCall = 10;
  static const int proposeMonitorUnfreezeCall = 11;
  static const int proposeMonitorConfiscateCall = 12;
  static const int proposeMonitorForceTransferCall = 13;
  static const int proposeMonitorForceCloseCall = 14;

  // ---- Legislation (25) · 立法院(立法/修法/废法发起)----
  // 法律结构化上链(章>节>条>款),发起类提案 QR 由节点端生成,冷钱包仅解码核对。
  // 投票/签署统一走 LegislationVote(26),本 pallet 仅承载 3 条 propose_X。
  static const int legislationPallet = 25;
  static const int proposeEnactLawCall = 0;
  static const int proposeAmendLawCall = 1;
  static const int proposeRepealLawCall = 2;

  // ---- LegislationVote (26) · 立法专属投票引擎 ----
  // 立法投票阶段：代表机构表决 / 特别案公投 / 行政签署 / 三人会签 / 护宪终审。
  static const int legislationVotePallet = 26;
  // call_index 0 永久留洞：特别案提案创建时由引擎按 actor CID 内联生成快照。
  static const int castRepresentativeVoteCall = 1;
  static const int castLegislationReferendumCall = 2;
  static const int executiveSignCall = 3;
  static const int overrideSignCall = 4;
  static const int guardVoteCall = 5;

  // ---- Offchain (19) · 清算行 L2 体系 ----
  static const int offchainPallet = 19;
  static const int bindClearingBankCall = 30;
  static const int depositCall = 31;
  static const int withdrawCall = 32;
  static const int switchBankCall = 33;
  static const int submitOffchainBatchCall = 34;
  static const int proposeL2FeeRateCall = 40;
  static const int setMaxL2FeeRateCall = 41;
  static const int registerClearingBankCall = 50;
  static const int updateClearingBankEndpointCall = 51;
  static const int unregisterClearingBankCall = 52;

  // ---- Address (33) · 注册局地址目录 ----
  static const int addressPallet = 33;
  static const int setAddressCatalogVersionCall = 0;
  static const int setAddressNameCall = 1;
  static const int removeAddressNameCall = 2;
  static const int setAddressCall = 3;
  static const int removeAddressCall = 4;

  // Revive(35) 不登记冷签动作。现有 sr25519/QR_V1 不能提交 Ethereum 包装或
  // SetOrigin 转换入口；普通 call/upload/map_account 亦不属于本钱包签名范围。
  // 未识别请求必须红色拒签，禁止仅因存在 pallet35 就按原生交易签名。

  // ---- Square (34) · 广场发布与会员订阅 ----
  static const int squarePallet = 34;
  static const int publishPostCall = 0;
  static const int subscribeCall = 1;
  static const int cancelSubscriptionCall = 2;
  static const int setCreatorPlansCall = 3;
  static const int changeSubscriptionPlanCall = 4;
  static const int proposeSetPlatformPriceCall = 5;
  static const int updateCreatorTierNameCall = 6;
}

// 表示并分类公民链机构码，供离线治理权限审阅使用。

/// 机构码(CID institution_code)冷钱包端表示与治理分类 = institution_code.dart
///
/// (铁律):
/// 本文件逐字镜像链端 `primitives::cid::code`(同一套 104 码)。链上治理用
/// 4 字节 `institution_code`([u8;4] 原始码字节,3 字符码右补 `0`)。
/// 冷钱包离线解码用本文件的纯函数从机构码派生治理分类
/// (是不是固定治理档 / 个人多签 / 机构账户),绝不另立第二套分类。
///
/// 字节表示:机构码是 3~4 个大写 ASCII 字符,统一用 4 字节,3 字符码右补 `0`:
///   NRC → [78,82,67,0]  CGOV → [67,71,79,86]  PMUL → [80,77,85,76]
class InstitutionCode {
  const InstitutionCode._();
  // 治理相关机构码常量(4 字节,3 字符码末位补 0)
  /// 国家储委会(固定治理档)。"NRC\0"。
  static const List<int> nrc = [78, 82, 67, 0];

  /// 省公民储备委员会(固定治理档)。"PRC\0"。
  static const List<int> prc = [80, 82, 67, 0];

  /// 省公民储备银行(固定治理档)。"PRB\0"。
  static const List<int> prb = [80, 82, 66, 0];

  /// 个人多签账户(不发号,仅链上/后端分类常量)。"PMUL"。
  static const List<int> pmul = [80, 77, 85, 76];
  // 字节 ↔ 字符串
  /// 取前 4 字节,去掉尾部 0 字节,UTF-8 → 大写字符串。
  static String codeToString(List<int> bytes) {
    var end = bytes.length < 4 ? bytes.length : 4;
    while (end > 0 && bytes[end - 1] == 0) {
      end--;
    }
    if (end == 0) return '';
    return utf8
        .decode(bytes.sublist(0, end), allowMalformed: true)
        .toUpperCase();
  }

  /// 字符串机构码 → 4 字节(右补 0,超 4 截断)。
  static List<int> codeBytes(String code) {
    final raw = utf8.encode(code.toUpperCase());
    final out = Uint8List(4);
    for (var i = 0; i < 4 && i < raw.length; i++) {
      out[i] = raw[i];
    }
    return out;
  }

  // 机构码分类清单(与链端 PUBLIC/PRIVATE/UNINCORPORATED 同源)
  /// 公权法人机构码(A 国家级 38 + B 省级 17 + C 市级 17 + D 镇级 14 + 公立大学/学校 2)= 88。
  static const Set<String> _publicLegalCodes = <String>{
    // A 国家级单体(38)
    'PRS', 'FSC', 'FIB', 'FSS', 'FPR', 'FRG', 'MFA', 'MDF',
    'ARM', 'NAV', 'AIR', 'SPF', 'JOS', 'ARC', 'NVC', 'AFC',
    'SFC', 'MHS', 'NGB', 'NGC', 'MCW', 'FDA', 'MHU', 'MAG',
    'MCM', 'MFT', 'MEN', 'MTR', 'NLG', 'NSN', 'NRP', 'NJD',
    'NSP', 'FAC', 'FAU', 'FIV', 'NED', 'NRC',
    // B 省级类型(17)
    'PGV', 'PLG', 'PSN', 'PRP', 'PJD', 'PSP', 'PRC', 'PRB',
    'PDF', 'PHS', 'PCW', 'PHU', 'PAG', 'PCM', 'PFT', 'PEN',
    'PTR',
    // C 市级类型(17)
    'CGOV', 'CLEG', 'CSUP', 'CJUD', 'CEDU', 'CSLF', 'CDEF', 'CHSC', 'CCWF',
    'CHUD', 'CAGR', 'CCOM', 'CFIN', 'CENR', 'CTRN', 'CREG', 'CPOL',
    // D 镇级类型(14)
    'TGOV', 'TCWF', 'THUD', 'TAGR', 'TFIN', 'TDEF', 'THSC', 'TCOM', 'TENR',
    'TTRN', 'TPOL', 'TSLF', 'TSUP', 'TJUD',
    // 公立大学 / 公立学校
    'GUN', 'GSCH',
  };

  /// 私权法人机构码(有限合伙/股权/股份/公益/注册协会 + 私立/教会大学/学校)= 9。
  static const Set<String> _privateLegalCodes = <String>{
    'SFLP',
    'SFGQ',
    'SFGF',
    'SFGY',
    'SFAS',
    'SUN',
    'JUN',
    'SFSC',
    'JSCH',
  };

  /// 非法人机构码(个体经营/无限合伙/非法人组织)= 3。
  static const Set<String> _unincorporatedCodes = <String>{
    'SFGT',
    'SFGP',
    'UNIN',
  };
  // 治理策略派生(纯函数,冷钱包唯一分类来源)
  /// 是否为固定治理档机构码(国家储委会/省储委会/省储行/联邦注册局/国家司法院)。
  static bool isFixedGovernance(String code) {
    return code == 'NRC' ||
        code == 'PRC' ||
        code == 'PRB' ||
        code == 'FRG' ||
        code == 'NJD';
  }

  /// 是否为个人多签账户机构码(PMUL)。
  static bool isPersonal(String code) {
    return code == 'PMUL';
  }

  /// 是否为公权法人机构码。
  static bool isPublicLegal(String code) => _publicLegalCodes.contains(code);

  /// 是否为私权法人机构码。
  static bool isPrivateLegal(String code) => _privateLegalCodes.contains(code);

  /// 是否为非法人机构码。
  static bool isUnincorporated(String code) =>
      _unincorporatedCodes.contains(code);

  /// 是否为机构账户机构码(公权/私权/非法人法人实体,经实体生命周期模块注册多签)。
  ///
  /// 个人/个人多签不算机构账户;
  /// 固定治理档(NRC/PRC/PRB/FRG/NJD)是 china 内建创世账户,走固定治理路径,也不算机构账户。
  static bool isInstitution(String code) {
    if (isFixedGovernance(code)) return false;
    return isPublicLegal(code) ||
        isPrivateLegal(code) ||
        _unincorporatedCodes.contains(code);
  }

  /// 是否为注册多签动态阈值账户机构码(个人多签 或 机构账户)。
  /// 固定治理档不在内。镜像链端 `is_registered_multisig_code`。
  static bool isRegisteredMultisig(String code) {
    return isPersonal(code) || isInstitution(code);
  }

  /// 机构码人机展示标签:固定治理档/个人多签特化为中文名,其余返回码字符串本身。
  static String codeLabel(String code) {
    switch (code) {
      case 'NRC':
        return '国家储委会';
      case 'PRC':
        return '省储委会';
      case 'PRB':
        return '省储行';
      case 'FRG':
        return '联邦注册局';
      case 'NJD':
        return '国家司法院';
      case 'PMUL':
        return '个人多签';
      default:
        return code;
    }
  }
}
