//! Vesting schedule enforcement.

pub struct VestingSchedule {
    pub cliff_slots: u64,
    pub total_slots: u64,
    pub total_amount: u64,
}

impl VestingSchedule {
    pub fn team(total_amount: u64, slots_per_year: u64) -> Self {
        Self {
            cliff_slots: slots_per_year,
            total_slots: slots_per_year.saturating_mul(4),
            total_amount,
        }
    }

    pub fn early_backers(total_amount: u64, slots_per_year: u64) -> Self {
        Self {
            cliff_slots: slots_per_year / 2,
            total_slots: slots_per_year.saturating_mul(2),
            total_amount,
        }
    }

    pub fn unlocked_at(&self, elapsed_slots: u64) -> u64 {
        if elapsed_slots < self.cliff_slots {
            return 0;
        }
        let elapsed = elapsed_slots.min(self.total_slots);
        (u128::from(self.total_amount) * u128::from(elapsed) / u128::from(self.total_slots)) as u64
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const SLOTS_PER_YEAR: u64 = 78_840_000;

    #[test]
    fn test_before_cliff_nothing_unlocked() {
        let sched = VestingSchedule::team(1_000_000, SLOTS_PER_YEAR);
        assert_eq!(sched.unlocked_at(0), 0);
        assert_eq!(sched.unlocked_at(SLOTS_PER_YEAR - 1), 0);
    }

    #[test]
    fn test_at_cliff_some_unlocked() {
        let sched = VestingSchedule::team(1_200_000, SLOTS_PER_YEAR);
        assert_eq!(sched.unlocked_at(SLOTS_PER_YEAR), 300_000);
    }

    #[test]
    fn test_full_vest_at_end() {
        let sched = VestingSchedule::team(1_000_000, SLOTS_PER_YEAR);
        assert_eq!(sched.unlocked_at(SLOTS_PER_YEAR * 4), 1_000_000);
    }
}
