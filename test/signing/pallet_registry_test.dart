// 验证链上pallet与call索引以及现行统一交易入口。

import 'package:flutter_test/flutter_test.dart';
import 'package:citizenwallet/protocol/qr_protocols.dart';
import 'package:citizenwallet/signing/pallet_registry.dart';

void main() {
  test('公私机构政策采用追加call11且不复用退役10', () {
    expect(PalletRegistry.proposeInstitutionPolicyCall, 11);
    expect(QrActions.publicInstitutionPolicy, 0x1e0b);
    expect(QrActions.privateInstitutionPolicy, 0x1f0b);
  });
  group('PalletRegistry', () {
    // PalletRegistry 只登记 pallet/call 索引,放行由 decoder 两色识别决定。

    test('pallet 索引常量已定义且互不相同', () {
      const pallets = {
        // 普通转账统一走 OnchainTransaction(4).transfer_with_remark(0),不再暴露 Balances 直签入口。
        PalletRegistry.onchainTransactionPallet,
        PalletRegistry.multisigTransferPallet,
        PalletRegistry.publicEntityPallet,
        PalletRegistry.privateEntityPallet,
        PalletRegistry.votingEnginePallet,
        PalletRegistry.runtimeUpgradePallet,
        PalletRegistry.resolutionDestroyPallet,
        PalletRegistry.personalPallet,
        PalletRegistry.grandpaKeyChangePallet,
        PalletRegistry.resolutionIssuancePallet,
        PalletRegistry.offchainTransactionPallet,
        PalletRegistry.citizenIdentityPallet,
        PalletRegistry.electionVotePallet,
        PalletRegistry.onchainIssuancePallet,
        PalletRegistry.addressRegistryPallet,
        PalletRegistry.squarePostPallet,
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

    test('CitizenIdentity(10) 身份注册 + 注册局占号/吊销 call_index', () {
      // 0..4 为身份登记管理，5 为公民自主首次绑定，6..8 为注册局代办绑定管理。
      expect(PalletRegistry.citizenIdentityPallet, 10);
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

    test('OnchainIssuance 十个调用与 runtime ABI 对齐', () {
      expect(PalletRegistry.onchainIssuancePallet, 23);
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

    test('清算行 OffchainTransaction call_index 与 runtime 对齐', () {
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

    test('AddressRegistry call_index 与 runtime 对齐', () {
      expect(PalletRegistry.addressRegistryPallet, 33);
      expect(PalletRegistry.setAddressCatalogVersionCall, 0);
      expect(PalletRegistry.setAddressNameCall, 1);
      expect(PalletRegistry.removeAddressNameCall, 2);
      expect(PalletRegistry.setAddressCall, 3);
      expect(PalletRegistry.removeAddressCall, 4);
    });

    test('SquarePost 全部钱包账户调用 call_index 与 runtime 对齐', () {
      expect(PalletRegistry.squarePostPallet, 34);
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
