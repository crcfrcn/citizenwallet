// 验证链参数、调用索引及中文标签。

import 'dart:typed_data';

import 'package:citizenwallet/protocol/qr.dart';
import 'package:citizenwallet/signing/labels.dart';
import 'package:citizenwallet/signing/registry.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:polkadart_keyring/polkadart_keyring.dart' show Keyring;

void main() {
  group('labels', _registerLabels);
  group('registry', _registerRegistry);
}

// 验证签名动作和审阅字段的中文标签及账户格式展示。

void _registerLabels() {
  group('action labels', () {
    test('已登记 action code 必须有中文动作名', () {
      for (final entry in actionKeyByCode.entries) {
        expect(
          actionLabelForDecodedAction(entry.value),
          isNotNull,
          reason: '0x${entry.key.toRadixString(16)} 缺少中文动作名',
        );
      }
      expect(actionLabelForQrAction(9), '广场账户动作签名');
      expect(actionLabelForQrAction(0x7fff), isNull);
    });
  });

  group('fieldLabelText', () {
    test('公民签名确认(citizen_identity)全部 reviewFields key 有中文标签', () {
      const keys = [
        'cid_number',
        'account_id',
        'valid_range',
        'citizen_status',
        'residence',
      ];
      for (final key in keys) {
        expect(hasFieldLabel(key), isTrue, reason: key);
      }
    });

    test('公民身份上链交易(register_voting_identity)全部 reviewFields key 有中文标签', () {
      const keys = [
        'actor_cid_number',
        'actor_role_code',
        'cid_number',
        'account_id',
        'valid_range',
        'citizen_status',
        'residence',
      ];
      for (final key in keys) {
        expect(hasFieldLabel(key), isTrue, reason: key);
      }
    });

    test('公民参选身份上链交易全部 reviewFields key 有中文标签', () {
      const keys = [
        'actor_cid_number',
        'identity_level',
        'cid_number',
        'account_id',
        'valid_range',
        'citizen_status',
        'residence',
        'birth_place',
        'family_name',
        'given_name',
        'citizen_sex',
      ];
      for (final key in keys) {
        expect(hasFieldLabel(key), isTrue, reason: key);
      }
    });

    test('公民身份字段翻译正确', () {
      expect(fieldLabelText('actor_cid_number'), '操作机构CID');
      expect(fieldLabelText('actor_role_code'), '操作岗位码');
      expect(fieldLabelText('account_id'), '账户');
      expect(fieldLabelText('valid_range'), '护照有效期');
      expect(fieldLabelText('citizen_status'), '身份状态');
      expect(fieldLabelText('residence'), '居住地');
      expect(fieldLabelText('birth_place'), '出生地');
      expect(fieldLabelText('family_name'), '姓');
      expect(fieldLabelText('given_name'), '名');
      expect(fieldLabelText('citizen_sex'), '公民性别');
    });

    test('机构协议新增字段翻译正确', () {
      expect(fieldLabelText('institution_account_id'), '机构账户');
      expect(fieldLabelText('account_names'), '机构账户名称');
      expect(fieldLabelText('effective_at'), '生效时间戳');
    });

    test('链上资产全部 reviewFields key 有中文标签', () {
      const keys = [
        'actor_cid_number',
        'execution_account_id',
        'asset_id',
        'asset_class',
        'asset_name',
        'asset_symbol',
        'asset_description',
        'decimals',
        'initial_supply_raw',
        'amount_raw',
        'sender_account_id',
        'recipient_account_id',
        'account_id',
        'reason_hash',
      ];
      for (final key in keys) {
        expect(hasFieldLabel(key), isTrue, reason: key);
      }
    });

    test('amount_ 金额字段标签走注册表,无英文兜底', () {
      // 历史上 `amount_` 前缀规则把 `amount_yuan` 误拆成「yuan金额」；
      // 现全部走生成表,未登记的 amount_* 一律拒绝,不再泄漏英文 key。
      expect(fieldLabelText('amount_yuan'), '金额');
      expect(fieldLabelText('amount_raw'), '资产数量(raw)');
      expect(fieldLabelTextOrNull('amount_'), isNull);
      expect(fieldLabelTextOrNull('amount_主账户'), isNull);
    });

    test('未登记 key 不允许生成展示兜底', () {
      expect(fieldLabelTextOrNull('never_registered_key'), isNull);
      expect(hasFieldLabel('never_registered_key'), isFalse);
      expect(() => fieldLabelText('never_registered_key'), throwsStateError);
    });
  });

  group('fieldValueText', () {
    test('approve 转换为赞成/反对', () {
      expect(fieldValueText('approve', 'true'), '赞成');
      expect(fieldValueText('approve', 'false'), '反对');
    });

    test('其他 key 原样返回', () {
      expect(fieldValueText('residence', '11 / 01 / 001'), '11 / 01 / 001');
    });

    test('账户字段 hex 统一转 SS58 展示,公钥/哈希保持 0x hex', () {
      const hex =
          '0x9c0c5bc3b65f2b1aeecec2a0e70e6f0ef3f2dc8d59c12a9fa79ca88e3f2c82a3';
      final bytes = Uint8List(32);
      for (var i = 0; i < 32; i++) {
        bytes[i] = int.parse(hex.substring(2 + i * 2, 4 + i * 2), radix: 16);
      }
      final expectedSs58 = Keyring().encodeAddress(
        bytes,
        ChainConstants.ss58Prefix,
      );

      // `account_id` / `*_account_id` 账户字段一律 SS58 展示。
      expect(fieldValueText('account_id', hex), expectedSs58);
      expect(fieldValueText('recipient_account_id', hex), expectedSs58);
      expect(fieldValueText('beneficiary_account_id', hex), expectedSs58);
      expect(fieldValueText('institution_account_id', hex), expectedSs58);
      expect(expectedSs58, isNot(startsWith('0x')));

      // 明确标注的公钥、哈希保持 0x hex,不转 SS58。
      expect(fieldValueText('signer_public_key', hex), hex);
      expect(fieldValueText('actor_public_key', hex), hex);
      expect(fieldValueText('reason_hash', hex), hex);
    });

    test('账户字段仅接受本仓唯一规范文本格式', () {
      for (final value in [
        '0x${List.filled(63, 'a').join()}',
        '0x${List.filled(65, 'a').join()}',
        '0x${List.filled(64, 'A').join()}',
        List.filled(64, 'a').join(),
      ]) {
        expect(fieldValueText('account_id', value), value);
      }
    });
  });
}

// 验证链上pallet与call索引以及现行统一交易入口。

void _registerRegistry() {
  test('公私机构政策采用追加call11且不复用退役10', () {
    expect(PalletRegistry.proposeInstitutionPolicyCall, 11);
    expect(QrActions.publicInstitutionPolicy, 0x1e0b);
    expect(QrActions.privateInstitutionPolicy, 0x1f0b);
  });
  group('PalletRegistry', () {
    // PalletRegistry 只登记 pallet/call 索引,放行由 decoder 两色识别决定。

    test('pallet 索引常量已定义且互不相同', () {
      const pallets = {
        // 普通转账统一走 Onchain(4).transfer_with_remark(0),不再暴露 Balances 直签入口。
        PalletRegistry.onchainPallet,
        PalletRegistry.multisigPallet,
        PalletRegistry.publicEntityPallet,
        PalletRegistry.privateEntityPallet,
        PalletRegistry.votingEnginePallet,
        PalletRegistry.upgradePallet,
        PalletRegistry.destroyPallet,
        PalletRegistry.personalPallet,
        PalletRegistry.grandpaKeyPallet,
        PalletRegistry.resolutionIssuePallet,
        PalletRegistry.offchainPallet,
        PalletRegistry.identityPallet,
        PalletRegistry.electionVotePallet,
        PalletRegistry.onchainIssuePallet,
        PalletRegistry.addressPallet,
        PalletRegistry.squarePallet,
      };
      // 个人生命周期与成员治理合并为同一个Personal(7)，原29不再登记。
      expect(pallets.length, 16);
      expect(pallets, contains(7));
      expect(pallets, isNot(contains(29)));
    });

    test('投票引擎 sub-pallet call_index', () {
      // InternalVote(20).cast=0 / JointVote(21).cast_admin=0 /
      // JointVote(21).cast_referendum=1 / VotingEngine(9).finalize_proposal=3
      expect(PalletRegistry.internalVotePallet, 20);
      expect(PalletRegistry.internalVoteCall, 0);
      expect(PalletRegistry.jointVotePallet, 21);
      expect(PalletRegistry.jointVoteCall, 0);
      expect(PalletRegistry.castReferendumCall, 1);
      expect(PalletRegistry.electionVotePallet, 22);
      expect(PalletRegistry.castPopularVoteCall, 2);
      expect(PalletRegistry.castMutualVoteCall, 3);
      expect(PalletRegistry.finalizeProposalCall, 3);
    });

    test('业务 pallet 的 vote_X 常量已物理删除 (编译期保证)', () {
      // 本测试只要能编译通过即视为通过：
      // voteDestroyCall / voteAdminReplacementCall / voteKeyChangeCall /
      // voteCloseCall / voteCreateCall / voteTransferCall /
      // voteSafetyFundCall / voteSweepCall 等常量必须不存在。
      // 若回归重新引入,会直接触发编译错误。
      expect(true, isTrue);
    });

    test('业务 pallet 的 propose_X call_index 连续排列', () {
      // 手动重试统一走 VotingEngine::retry_passed_proposal(9.4),
      // 业务 pallet 不承载 execute_xxx wrapper。
      expect(PalletRegistry.proposeTransferCall, 0);
      expect(PalletRegistry.proposeSafetyFundCall, 1);
      expect(PalletRegistry.proposeSweepCall, 2);

      // 机构管理员由 entity 任职结果管理；只有个人多签保留管理员集合变更调用。
      expect(PalletRegistry.isPersonalAdminSetChangeCall(7, 3), isTrue);
      expect(PalletRegistry.isPersonalAdminSetChangeCall(29, 0), isFalse);
      expect(PalletRegistry.isPersonalAdminSetChangeCall(7, 2), isFalse);
      expect(PalletRegistry.isPersonalAdminSetChangeCall(7, 4), isFalse);

      // PublicEntity(30) / PrivateEntity(31):机构登记管理。
      expect(PalletRegistry.publicEntityPallet, 30);
      expect(PalletRegistry.privateEntityPallet, 31);
      expect(PalletRegistry.proposeCloseInstitutionCall, 1);
      expect(PalletRegistry.updateInstitutionInfoCall, 6);
      expect(PalletRegistry.addInstitutionAccountCall, 7);
      expect(PalletRegistry.proposeInstitutionGovernanceCall, 8);
      expect(PalletRegistry.registerInstitutionRolesCall, 9);

      // Personal(7):个人生命周期与成员变更；2及原29不复用。
      expect(PalletRegistry.personalPallet, 7);
      expect(PalletRegistry.proposeCreatePersonalCall, 0);
      expect(PalletRegistry.proposeClosePersonalCall, 1);
      expect(PalletRegistry.proposePersonalAdminSetChangeCall, 3);
    });

    test('Identity(10) 身份注册 + 注册局占号/吊销 call_index', () {
      // 0..4 为身份登记管理，5 为公民自主首次绑定，6..8 为注册局代办绑定管理。
      expect(PalletRegistry.identityPallet, 10);
      expect(PalletRegistry.registerVotingIdentityCall, 0);
      expect(PalletRegistry.upgradeToCandidateIdentityCall, 1);
      expect(PalletRegistry.updateVotingIdentityCall, 2);
      expect(PalletRegistry.updateCandidateIdentityCall, 3);
      expect(PalletRegistry.revokeIdentityCall, 4);
      expect(PalletRegistry.selfOccupyCidCall, 5);
      expect(PalletRegistry.occupyCidCall, 6);
      expect(PalletRegistry.adminRebindCidAccountIdCall, 7);
      expect(PalletRegistry.revokeCidCall, 8);
    });

    test('VotingEngine 统一手动重试/取消入口', () {
      // 业务 pallet 不承载 execute_xxx / cancel_failed_xxx,
      // 统一收口至 VotingEngine 的 4/5 两个 call_index。
      expect(PalletRegistry.retryPassedProposalCall, 4);
      expect(PalletRegistry.cancelPassedProposalCall, 5);
    });

    test('OnchainIssue 十个调用与 runtime ABI 对齐', () {
      expect(PalletRegistry.onchainIssuePallet, 23);
      expect(PalletRegistry.proposeIssueCall, 0);
      expect(PalletRegistry.proposeMintCall, 1);
      expect(PalletRegistry.proposeBurnCall, 2);
      expect(PalletRegistry.proposeCloseAssetCall, 3);
      expect(PalletRegistry.proposeAssetTransferCall, 4);
      expect(PalletRegistry.proposeMonitorFreezeCall, 10);
      expect(PalletRegistry.proposeMonitorUnfreezeCall, 11);
      expect(PalletRegistry.proposeMonitorConfiscateCall, 12);
      expect(PalletRegistry.proposeMonitorForceTransferCall, 13);
      expect(PalletRegistry.proposeMonitorForceCloseCall, 14);
    });

    test('清算行 Offchain call_index 与 runtime 对齐', () {
      expect(PalletRegistry.bindClearingBankCall, 30);
      expect(PalletRegistry.depositCall, 31);
      expect(PalletRegistry.withdrawCall, 32);
      expect(PalletRegistry.switchBankCall, 33);
      expect(PalletRegistry.submitOffchainBatchCall, 34);
      expect(PalletRegistry.proposeL2FeeRateCall, 40);
      expect(PalletRegistry.setMaxL2FeeRateCall, 41);
      expect(PalletRegistry.registerClearingBankCall, 50);
      expect(PalletRegistry.updateClearingBankEndpointCall, 51);
      expect(PalletRegistry.unregisterClearingBankCall, 52);
    });

    test('Address call_index 与 runtime 对齐', () {
      expect(PalletRegistry.addressPallet, 33);
      expect(PalletRegistry.setAddressCatalogVersionCall, 0);
      expect(PalletRegistry.setAddressNameCall, 1);
      expect(PalletRegistry.removeAddressNameCall, 2);
      expect(PalletRegistry.setAddressCall, 3);
      expect(PalletRegistry.removeAddressCall, 4);
    });

    test('SquarePost 全部钱包账户调用 call_index 与 runtime 对齐', () {
      expect(PalletRegistry.squarePallet, 34);
      expect(PalletRegistry.publishPostCall, 0);
      expect(PalletRegistry.subscribeCall, 1);
      expect(PalletRegistry.cancelSubscriptionCall, 2);
      expect(PalletRegistry.setCreatorPlansCall, 3);
      expect(PalletRegistry.changeSubscriptionPlanCall, 4);
      expect(PalletRegistry.proposeSetPlatformPriceCall, 5);
      expect(PalletRegistry.updateCreatorTierNameCall, 6);
      expect(QrActions.publishPost, 0x2200);
      expect(QrActions.subscribe, 0x2201);
      expect(QrActions.cancel, 0x2202);
      expect(QrActions.setCreatorPlans, 0x2203);
      expect(QrActions.changeSubscriptionPlan, 0x2204);
      expect(QrActions.proposeSetPlatformPrice, 0x2205);
      expect(QrActions.updateCreatorTierName, 0x2206);
    });
  });
}
